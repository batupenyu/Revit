# Electron API Not Available - Troubleshooting

## Quick Diagnostic Questions

### 1. How many windows do you see when you run `npm run dev`?

**A) ONE window** (Vite welcome page, looks like a browser)
  → **Electron is NOT launching**
  → Go to [Fix: Electron Not Starting](#fix-electron-not-starting)

**B) TWO windows** (browser page + Electron app)
  → **Electron IS launching**  
  → Go to [Fix: Preload Script Not Loading](#fix-preload-script-not-loading)

**C) Not sure / Can't tell**
  → Look for:
  - Dev tools that appear automatically?
  - Menu bar with "File, Edit, View..." or similar?
  - In taskbar, does it say "Electron" or similar in the process name?

---

## Fix: Electron Not Starting

If Electron is not launching at all, try these:

### Step 1: Clear cache and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
npm run prisma:generate
```

### Step 2: Try manual start
Start Vite and Electron separately:

**Terminal 1 - Start Vite dev server:**
```bash
npm run dev:vite
```
Wait until you see: `ready in 123 ms` or similar

**Terminal 2 - Start Electron:**
```bash
npm run dev:electron
```

If Electron app appears now, the issue is with `npm run dev` script timing.

### Step 3: Check if Electron executable exists
```bash
# On Windows
.\node_modules\.bin\electron.cmd --version

# On Mac/Linux
./node_modules/.bin/electron --version
```

If this shows an error, reinstall Electron:
```bash
npm install --save-dev electron@27.0.0
```

### Step 4: Check package.json main entry
```bash
grep "\"main\"" package.json
```
Should show: `"main": "src/main/index.js"`

If not, it's wrong and Electron won't find the main process.

---

## Fix: Preload Script Not Loading

If Electron IS launching but `window.electron` is undefined:

### Step 1: Check DevTools Console

When the Electron app opens, DevTools should open automatically.

**Look for these messages:**

✓ **Good sign - you should see:**
```
╔════════════════════════════════════════╗
║    PRELOAD SCRIPT EXECUTING...        ║
╚════════════════════════════════════════╝
...
✓ PRELOAD SCRIPT LOADED SUCCESSFULLY
✓ window.electron is now available
```

✗ **Bad sign - you see:**
```
window.electron: undefined
✗ window.electron is undefined!
```

✗ **Worst sign - No preload logs at all:**
This means preload.js is not executing

### Step 2: Check Main Process Console

Look at the terminal where you ran Electron (not Vite).

**Good signs:**
```
╔════════════════════════════════════════╗
║  MAIN PROCESS STARTED                 ║
╚════════════════════════════════════════╝
Electron version: 27.x.x
...
╔════════════════════════════════════════╗
║  CREATING WINDOW                      ║
╚════════════════════════════════════════╝
__dirname: /path/to/src/main
Preload path (resolved): /path/to/src/main/preload.js
Preload file exists: true
...
✓ Window content finished loading
```

**Red flags:**
```
✗ FATAL: Preload file not found!
✗ Preload error: ...
Preload file exists: false
```

### Step 3: Verify Preload File Location

Make sure these files exist:
```bash
# On Windows
dir src\main\preload.js
dir src\main\index.js

# On Mac/Linux  
ls src/main/preload.js
ls src/main/index.js
```

### Step 4: Check for Syntax Errors in Preload

Run:
```bash
node src/main/preload.js
```

If there's a syntax error, it will show here. The preload should fail with "require('electron') not found" since we're running it directly, but that's expected.

### Step 5: Rebuild Vite

The dev server might be caching something:
```bash
npm run dev:vite -- --force
```

Then in another terminal:
```bash
npm run dev:electron
```

---

## If Nothing Works

### Option 1: Start from scratch with simpler setup

```bash
# Kill all node/electron processes
# Windows: taskkill /IM node.exe /F && taskkill /IM electron.exe /F
# Mac/Linux: killall node; killall electron

# Clean install
rm -rf node_modules
npm install

# Generate Prisma  
npm run prisma:generate

# Try manual start
npm run dev:vite
# In another terminal
npm run dev:electron
```

### Option 2: Check Electron version compatibility

Some Electron 27 versions have issues with context isolation. Try:
```bash
npm install --save-dev electron@latest
```

### Option 3: Enable more debug logging

Edit `src/main/index.js` and add after line 88 (after `mainWindow.webContents.on`):

```javascript
mainWindow.webContents.on('before-input-event', (event, input) => {
  if (input.control && input.shift && input.keyCode === 73) { // Ctrl+Shift+I
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  }
});
```

This ensures DevTools can be toggled with Ctrl+Shift+I

---

## Collect This Info for Help

If still not working, save this output:

1. **Main process output** - Copy terminal logs from Electron process
2. **DevTools console** - Right-click in DevTools console, select "Save as..." to save logs
3. **Error messages** - Take screenshot of error banner or console errors
4. **File verification** - Run and save output of:
   ```bash
   ls -la src/main/
   grep '"main"' package.json
   ./node_modules/.bin/electron.cmd --version  # Windows
   ```

---

## Environment Info

Share this:
- Windows/Mac/Linux and version?
- Node version: `node --version`
- npm version: `npm --version`
- Which terminal: PowerShell / CMD / Git Bash / WSL?

This helps identify OS-specific issues.
