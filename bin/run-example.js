#!/usr/bin/env node

/**
 * Lerna installs all the example dependencies into the root `node_modules`.
 * To run the examples they need to have access to executables from npm dependencies in their $PATH.
 * If you run `npm start` in a dependency folder, the root `node_modules/.bin` is not in the $PATH.
 *
 * This proxy executable can be run from the repository root using `npm run example`, so the root
 * `node_modules/.bin` will be in the $PATH. It then runs `npm start` in the specific example folder,
 * which will inherit the $PATH, so the example has access to executables from npm dependencies in both
 * its own and in the root `node_modules`.
 */

const path = require('path')
const { execSync } = require('child_process')
const exampleName = process.argv[2]

if (!exampleName) {
  console.error('Usage: npm run example "name-of-example"')
  process.exit(1)
}

const exampleDir = path.join(__dirname, '../examples', exampleName)
const pkg = require(path.join(exampleDir, 'package.json'))
if (pkg.scripts && pkg.scripts.build) {
  execSync('npm run build', { cwd: exampleDir, stdio: 'inherit' })
}

execSync('npm start', { cwd: exampleDir, stdio: 'inherit' })
