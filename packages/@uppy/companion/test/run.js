#!/usr/bin/env node
const { execSync } = require('child_process')
const path = require('path')

process.chdir(path.join(__dirname, '..'))
try {
  execSync('jest --version', { shell: 'bash' })
} catch (err) {
  console.error('could not start jest, make sure this script is ran using `npm test`')
  process.exit(1)
}

execSync('npm run build', { stdio: 'inherit' })
execSync('source env.test.sh && jest', { shell: 'bash', stdio: 'inherit' })
