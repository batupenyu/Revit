#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing corrupted Electron installation...\n');

const electronPath = path.join(__dirname, 'node_modules', 'electron');
const distPath = path.join(electronPath, 'dist');
const pathTxtFile = path.join(electronPath, 'path.txt');

console.log('1. Checking Electron installation...');
console.log(`   Electron path: ${electronPath}`);
console.log(`   Dist exists: ${fs.existsSync(distPath)}`);
console.log(`   path.txt exists: ${fs.existsSync(pathTxtFile)}\n`);

if (!fs.existsSync(distPath) || !fs.existsSync(pathTxtFile)) {
  console.log('2. Electron is corrupted. Removing...');
  try {
    // Remove electron directory
    if (fs.existsSync(electronPath)) {
      fs.rmSync(electronPath, { recursive: true, force: true });
      console.log('   ✓ Deleted node_modules/electron\n');
    }
    
    console.log('3. Reinstalling Electron...');
    execSync('npm install electron@27.0.0 --save-dev', {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    console.log('\n4. Verifying installation...');
    if (fs.existsSync(distPath)) {
      console.log('   ✓ Dist folder exists');
    }
    if (fs.existsSync(pathTxtFile)) {
      console.log('   ✓ path.txt exists');
      const content = fs.readFileSync(pathTxtFile, 'utf-8');
      console.log(`   ✓ path.txt content: ${content}`);
    }
    
    console.log('\n5. Running Prisma generation...');
    execSync('npm run prisma:generate', {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    console.log('\n✅ Electron is now fixed! You can run: npm run dev\n');
  } catch (error) {
    console.error('❌ Error during fix:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Electron installation looks good!\n');
}
