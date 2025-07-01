#!/usr/bin/env node

import fs from 'node:fs/promises'
import chalk from 'chalk'

import esbuild from 'esbuild'

const UPPY_ROOT = new URL('../../', import.meta.url)
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

await fs.mkdir(new URL('./dist', import.meta.url), { recursive: true })

await fs.mkdir(new URL('./@uppy/locales/dist', PACKAGES_ROOT), { recursive: true })

const locales = (await fs.readdir(new URL('./@uppy/locales/lib', PACKAGES_ROOT))).flatMap((file) => {
  if (file.endsWith('.js')) {
    return [file.replace(/\.js$/, '')]
  }
  return []
});

const methods = [
  buildBundle(
    './src/bundle.ts',
    './dist/uppy.min.mjs',
    { standalone: 'Uppy (ESM)', format: 'esm' },
  ),
  buildBundle(
    './bundle.mjs',
    './dist/uppy.min.js',
    { standalone: 'Uppy', format: 'iife' },
  ),
  ...locales.map((locale) => buildBundle(
    `../../packages/@uppy/locales/lib/${locale}.js`,
    `../../packages/@uppy/locales/dist/${locale}.min.js`,
    { standalone: `Uppy Locale ${locale}`, format: 'iife' },
  )),
];

// Add BUNDLE-README.MD
methods.push(
  fs.copyFile(
    new URL('../../BUNDLE-README.md', import.meta.url),
    new URL('./dist/README.md', import.meta.url),
  ),
)

await Promise.all(methods).then(() => {
  console.info(chalk.yellow('✓ JS bundles 🎉'))
}, (err) => {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}) 