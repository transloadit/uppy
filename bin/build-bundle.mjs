#!/usr/bin/env node

import fs from 'node:fs/promises'
import chalk from 'chalk'

import esbuild from 'esbuild'

const UPPY_ROOT = new URL('../', import.meta.url)
const PACKAGES_ROOT = new URL('./packages/', UPPY_ROOT)

function buildBundle (srcFile, bundleFile, { minify = true, standalone = '', plugins, target, format } = {}) {
  return esbuild.build({
    bundle: true,
    sourcemap: true,
    entryPoints: [srcFile],
    outfile: bundleFile,
    platform: 'browser',
    minify,
    keepNames: target !== 'es5',
    plugins,
    tsconfigRaw: '{}',
    target,
    format,
  }).then(() => {
    if (minify) {
      console.info(chalk.green(`✓ Built Minified Bundle [${standalone}]:`), chalk.magenta(bundleFile))
    } else {
      console.info(chalk.green(`✓ Built Bundle [${standalone}]:`), chalk.magenta(bundleFile))
    }
  })
}

await fs.mkdir(new URL('./uppy/dist', PACKAGES_ROOT), { recursive: true })

const methods = [
  buildBundle(
    './packages/uppy/src/bundle.ts',
    './packages/uppy/dist/uppy.min.mjs',
    { standalone: 'Uppy (ESM)', format: 'esm' },
  ),
  buildBundle(
    './packages/uppy/bundle.mjs',
    './packages/uppy/dist/uppy.min.js',
    { standalone: 'Uppy', format: 'iife' },
  ),
]

// Add BUNDLE-README.MD
methods.push(
  fs.copyFile(
    new URL('./BUNDLE-README.md', UPPY_ROOT),
    new URL('./uppy/dist/README.md', PACKAGES_ROOT),
  ),
)

await Promise.all(methods).then(() => {
  console.info(chalk.yellow('✓ JS bundles 🎉'))
}, (err) => {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
})
