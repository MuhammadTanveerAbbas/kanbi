#!/usr/bin/env node
const { execSync } = require('child_process');

try {
  execSync('npx next lint', {
    stdio: 'inherit',
    cwd: __dirname
  });
} catch (error) {
  process.exit(error.status || 1);
}
