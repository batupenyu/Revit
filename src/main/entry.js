#!/usr/bin/env node
'use strict';

// src/main/entry.js
// ── Bypasses ELECTRON_RUN_AS_NODE (nvm-windows / machine-level env) ──
// When that env-var is present Electron's js2c startup code silently skips
// registering the built-in 'electron' module; require('electron') then falls
// through to the npm package, whose index.js deliberately exports only the
// binary path as a string (for CLI tooling, not API access).
//
// Fix: delete it from process.env and launch the real main entry via spawn
// so the child process never receives the variable in its environment block.

const { execFileSync } = require('child_process');
const path = require('path');

const MAIN_ENTRY  = path.resolve(__dirname, 'index.js');
const ELECTRON_EXE = path.resolve(__dirname, '..', '..', 'node_modules', 'electron', 'dist', 'electron.exe');

// Full session env WITHOUT ELECTRON_RUN_AS_NODE
const CLEAN_ENV = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => k !== 'ELECTRON_RUN_AS_NODE')
);

execFileSync(ELECTRON_EXE, [MAIN_ENTRY], {
  env: CLEAN_ENV,
  stdio: 'inherit',
  windowsHide: false,
});

