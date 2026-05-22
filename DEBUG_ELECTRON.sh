#!/bin/bash

echo "Checking Electron setup..."
echo ""

# Check if src/main/index.js exists
if [ -f "src/main/index.js" ]; then
  echo "✓ src/main/index.js exists"
else
  echo "✗ src/main/index.js NOT FOUND"
fi

# Check if src/main/preload.js exists
if [ -f "src/main/preload.js" ]; then
  echo "✓ src/main/preload.js exists"
else
  echo "✗ src/main/preload.js NOT FOUND"
fi

# Check if package.json has correct main entry
MAIN_ENTRY=$(grep '"main"' package.json)
echo "Main entry in package.json: $MAIN_ENTRY"

echo ""
echo "To manually test:"
echo "  1. In one terminal: npm run dev:vite"
echo "  2. Wait for 'ready in X ms'"
echo "  3. In another terminal: npm run dev:electron"
echo ""
echo "Or try combined:"
echo "  npm run dev"
echo ""
echo "Then check:"
echo "  - Are TWO windows open? (Vite welcome page AND Electron app)"
echo "  - DevTools should open automatically in Electron app"
echo "  - Look for preload script logs in DevTools console"
