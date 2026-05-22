const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// ── HOTFIX: ELECTRON_RUN_AS_NODE breaks built-in module registration ──
// Machine/user env var (commonly set by nvm-windows) makes require('electron')
// resolve to the npm package's index.js path-string instead of the js2c module.
// Clear it before ANY require('electron') call so js2c fires correctly.
delete process.env.ELECTRON_RUN_AS_NODE;

console.log('╔════════════════════════════════════════╗');
console.log('║  MAIN PROCESS STARTED                 ║');
console.log('╚════════════════════════════════════════╝');
console.log('ELECTRON_RUN_AS_NODE:', process.env.ELECTRON_RUN_AS_NODE ?? '(cleared)');
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);

const prisma = new PrismaClient();

let mainWindow;

function createWindow() {
  const preloadPath = path.resolve(__dirname, 'preload.js');
  
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  CREATING WINDOW                      ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('__dirname:', __dirname);
  console.log('Preload path (resolved):', preloadPath);
  console.log('Preload file exists:', fs.existsSync(preloadPath));
  const isDev = process.defaultApp || !app.isPackaged;
  console.log('isDev mode:', isDev);
  
  if (!fs.existsSync(preloadPath)) {
    console.error('✗ FATAL: Preload file not found!');
    console.error('Expected at:', preloadPath);
  }
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      enableRemoteModule: false,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../renderer/dist/index.html')}`;

  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);



  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✓ Window content finished loading');
  });

  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('✗ Preload error:', error);
  });



  mainWindow.webContents.on('crashed', () => {
    console.error('✗ Renderer process crashed');
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('ready', () => {
  console.log('✓ App ready event fired');
  createWindow();
});

app.on('window-all-closed', () => { 
  console.log('All windows closed');
  if (process.platform !== 'darwin') app.quit(); 
});

app.on('activate', () => { 
  console.log('App activated');
  if (mainWindow === null) createWindow(); 
});

app.on('before-quit', async () => { 
  console.log('Shutting down...');
  await prisma.$disconnect(); 
});

// PROJECT OPERATIONS
ipcMain.handle('db:createProject', async (event, data) => {
  try {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        budgetTotal: data.budgetTotal || 0,
        status: 'planning',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    return { success: true, data: project };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:getProjects', async () => {
  try {
    const projects = await prisma.project.findMany({
      include: { transactions: true, budgets: true, taxes: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: projects };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:getProjectById', async (event, projectId) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { transactions: true, budgets: true, taxes: true },
    });
    return { success: true, data: project };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:updateProject', async (event, data) => {
  try {
    const project = await prisma.project.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        budgetTotal: data.budgetTotal,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    return { success: true, data: project };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// TRANSACTION OPERATIONS
ipcMain.handle('db:createTransaction', async (event, data) => {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        projectId: data.projectId,
        type: data.type,
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount),
        quantity: data.quantity ? parseInt(data.quantity) : null,
        unitPrice: data.unitPrice ? parseFloat(data.unitPrice) : null,
        date: new Date(data.date),
        paymentStatus: data.paymentStatus || 'pending',
        vendorName: data.vendorName,
        notes: data.notes,
      },
    });
    if (data.category) {
      const budget = await prisma.budget.findFirst({
        where: { projectId: data.projectId, category: data.category },
      });
      if (budget) {
        await prisma.budget.update({
          where: { id: budget.id },
          data: { spentAmount: { increment: parseFloat(data.amount) } },
        });
      }
    }
    return { success: true, data: transaction };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:getTransactions', async (event, projectId) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
    });
    return { success: true, data: transactions };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:updateTransaction', async (event, data) => {
  try {
    const old = await prisma.transaction.findUnique({ where: { id: data.id } });
    if (old && old.category) {
      const budget = await prisma.budget.findFirst({
        where: { projectId: old.projectId, category: old.category },
      });
      if (budget) {
        await prisma.budget.update({
          where: { id: budget.id },
          data: { spentAmount: { decrement: old.amount } },
        });
      }
    }
    const transaction = await prisma.transaction.update({
      where: { id: data.id },
      data: {
        type: data.type,
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount),
        quantity: data.quantity ? parseInt(data.quantity) : null,
        unitPrice: data.unitPrice ? parseFloat(data.unitPrice) : null,
        date: new Date(data.date),
        paymentStatus: data.paymentStatus,
        vendorName: data.vendorName,
        notes: data.notes,
      },
    });
    if (data.category) {
      const budget = await prisma.budget.findFirst({
        where: { projectId: data.projectId, category: data.category },
      });
      if (budget) {
        await prisma.budget.update({
          where: { id: budget.id },
          data: { spentAmount: { increment: parseFloat(data.amount) } },
        });
      }
    }
    return { success: true, data: transaction };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:deleteTransaction', async (event, transactionId) => {
  try {
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (transaction && transaction.category) {
      const budget = await prisma.budget.findFirst({
        where: { projectId: transaction.projectId, category: transaction.category },
      });
      if (budget) {
        await prisma.budget.update({
          where: { id: budget.id },
          data: { spentAmount: { decrement: transaction.amount } },
        });
      }
    }
    await prisma.transaction.delete({ where: { id: transactionId } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// BUDGET OPERATIONS
ipcMain.handle('db:createBudget', async (event, data) => {
  try {
    const budget = await prisma.budget.create({
      data: {
        projectId: data.projectId,
        category: data.category,
        allocatedAmount: parseFloat(data.allocatedAmount),
        notes: data.notes,
      },
    });
    return { success: true, data: budget };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:getBudgets', async (event, projectId) => {
  try {
    const budgets = await prisma.budget.findMany({ where: { projectId } });
    return { success: true, data: budgets };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// TAX OPERATIONS
ipcMain.handle('db:createTax', async (event, data) => {
  try {
    const tax = await prisma.tax.create({
      data: {
        projectId: data.projectId,
        taxType: data.taxType,
        amount: parseFloat(data.amount),
        percentage: data.percentage ? parseFloat(data.percentage) : null,
        relatedTransactionId: data.relatedTransactionId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'unpaid',
        notes: data.notes,
      },
    });
    return { success: true, data: tax };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:getTaxes', async (event, projectId) => {
  try {
    const taxes = await prisma.tax.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' },
    });
    return { success: true, data: taxes };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:updateTaxStatus', async (event, data) => {
  try {
    const tax = await prisma.tax.update({
      where: { id: data.id },
      data: {
        status: data.status,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      },
    });
    return { success: true, data: tax };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// PAYMENT OPERATIONS
ipcMain.handle('db:recordPayment', async (event, data) => {
  try {
    const payment = await prisma.paymentRecord.create({
      data: {
        transactionId: data.transactionId || null,
        taxId: data.taxId || null,
        amountPaid: parseFloat(data.amountPaid),
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate),
        referenceNumber: data.referenceNumber,
        notes: data.notes,
      },
    });
    if (data.transactionId) {
      await prisma.transaction.update({
        where: { id: data.transactionId },
        data: { paymentStatus: 'paid' },
      });
    }
    if (data.taxId) {
      await prisma.tax.update({
        where: { id: data.taxId },
        data: { status: 'paid', paymentDate: new Date(data.paymentDate) },
      });
    }
    return { success: true, data: payment };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// STATISTICS
ipcMain.handle('db:getProjectStats', async (event, projectId) => {
  try {
    const [transactions, budgets, taxes] = await Promise.all([
      prisma.transaction.findMany({ where: { projectId } }),
      prisma.budget.findMany({ where: { projectId } }),
      prisma.tax.findMany({ where: { projectId } }),
    ]);

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type !== 'income').reduce((s, t) => s + t.amount, 0);
    const totalTax = taxes.reduce((s, t) => s + t.amount, 0);
    const unpaidTax = taxes.filter(t => t.status !== 'paid').reduce((s, t) => s + t.amount, 0);

    const expenseByCategory = {};
    transactions.forEach(t => {
      if (t.type !== 'income') {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      }
    });

    return {
      success: true,
      data: {
        totalIncome,
        totalExpense,
        totalTax,
        unpaidTax,
        balance: totalIncome - totalExpense - totalTax,
        expenseByCategory,
        budgetStatus: budgets.map(b => ({
          category: b.category,
          allocated: b.allocatedAmount,
          spent: b.spentAmount,
          remaining: b.allocatedAmount - b.spentAmount,
          percentage: (b.spentAmount / b.allocatedAmount * 100).toFixed(2),
        })),
        transactionCount: transactions.length,
        taxCount: taxes.length,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

let printWindow = null;

ipcMain.handle('print-window', () => {
  if (printWindow) printWindow.webContents.print({ silent: false, printBackground: true });
});

ipcMain.handle('print', async (event, html) => {
  const tmpFile = path.join(app.getPath('temp'), 'print-preview.html');
  const htmlWithPrintBtn = html.replace('</body>', `
    <div style="position:fixed;top:10px;right:10px;z-index:9999;background:white;padding:4px;border-radius:6px">
      <button onclick="window.print()" style="padding:8px 16px;background:#4f46e5;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px">🖨️ Cetak</button>
    </div>
  </body>`);
  fs.writeFileSync(tmpFile, htmlWithPrintBtn, 'utf-8');

  printWindow = new BrowserWindow({
    width: 900, height: 700, title: 'Print Preview',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  printWindow.loadFile(tmpFile);
  printWindow.on('closed', () => { printWindow = null; });
});

module.exports = { prisma };
