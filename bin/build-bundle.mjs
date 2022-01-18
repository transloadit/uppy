#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import chalk from 'chalk'

import esbuild from 'esbuild'
import babel from 'esbuild-plugin-babel'

const UPPY_ROOT = new URL('../', import.meta.url)
const PACKAGES_ROOT = new URL('./packages/', UPPY_ROOT)

function buildBundle (srcFile, bundleFile, { minify = true, standalone = '', plugins, target } = {}) {
  return esbuild.build({
    bundle: true,
    sourcemap: true,
    entryPoints: [srcFile],
    outfile: bundleFile,
    banner: {
      js: '"use strict";',
    },
    minify,
    plugins,
    target,
  }).then(() => {
    if (minify) {
      console.info(chalk.green(`✓ Built Minified Bundle [${standalone}]:`), chalk.magenta(bundleFile))
    } else {
      console.info(chalk.green(`✓ Built Bundle [${standalone}]:`), chalk.magenta(bundleFile))
    }
  })
}

await fs.mkdir(new URL('./uppy/dist', PACKAGES_ROOT), { recursive: true })
await fs.mkdir(new URL('./@uppy/robodog/dist', PACKAGES_ROOT), { recursive: true })
await fs.mkdir(new URL('./@uppy/locales/dist', PACKAGES_ROOT), { recursive: true })

const methods = [
  buildBundle(
    './packages/uppy/index.js',
    './packages/uppy/dist/uppy.min.js',
    { standalone: 'Uppy' },
  ),
  buildBundle(
    './packages/uppy/bundle.js',
    './packages/uppy/dist/uppy.legacy.min.js',
    {
      standalone: 'Uppy (with polyfills)',
      target: 'es5',
      plugins:[babel({
        config:{
          compact: false,
          highlightCode: false,
          inputSourceMap: true,

          browserslistEnv: 'legacy',
          presets: [['@babel/preset-env',  {
            loose: false,
            targets: { ie:11 },
            useBuiltIns: 'entry',
            corejs: { version: '3.15', proposals: true },
          }]],
        },
      })],
    },
  ),
  buildBundle(
    './packages/@uppy/robodog/bundle.js',
    './packages/@uppy/robodog/dist/robodog.min.js',
    { standalone: 'Robodog' },
  ),
]

// Build minified versions of all the locales
const localesModules = await fs.opendir(new URL('./@uppy/locales/src/', PACKAGES_ROOT))
for await (const dirent of localesModules) {
  if (!dirent.isDirectory() && dirent.name.endsWith('.js')) {
    const localeName = path.basename(dirent.name, '.js')
    methods.push(
      buildBundle(
        `./packages/@uppy/locales/src/${localeName}.js`,
        `./packages/@uppy/locales/dist/${localeName}.min.js`,
        { minify: true },
      ),
    )
  }
}

// Add BUNDLE-README.MD
methods.push(
  fs.copyFile(
    new URL('./BUNDLE-README.md', UPPY_ROOT),
    new URL('./uppy/dist/README.md', PACKAGES_ROOT),
  ),
)

Promise.all(methods).then(() => {
  console.info(chalk.yellow('✓ JS bundles 🎉'))
}, (err) => {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
})
