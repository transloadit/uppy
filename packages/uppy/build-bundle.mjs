#!/usr/bin/env node

import fs from 'node:fs/promises'
import { styleText } from 'node:util'

import esbuild from 'esbuild'

const UPPY_ROOT = new URL('../../', import.meta.url)
const PACKAGES_ROOT = new URL('./packages/', UPPY_ROOT)

function buildBundle(
  srcFile,
  bundleFile,
  { minify = true, standalone = '', plugins, target, format } = {},
) {
  return esbuild
    .build({
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
    })
    .then(() => {
      if (minify) {
        console.info(
          styleText('green', `✓ Built Minified Bundle [${standalone}]:`),
          styleText('magenta', bundleFile),
        )
      } else {
        console.info(
          styleText('green', `✓ Built Bundle [${standalone}]:`),
          styleText('magenta', bundleFile),
        )
      }
    })
}

await fs.mkdir(new URL('./dist', import.meta.url), { recursive: true })

await fs.mkdir(new URL('./@uppy/locales/dist', PACKAGES_ROOT), {
  recursive: true,
})

const locales = (
  await fs.readdir(new URL('./@uppy/locales/lib', PACKAGES_ROOT))
).flatMap((file) => {
  if (file.endsWith('.js')) {
    return [file.replace(/\.js$/, '')]
  }
  return []
})

const methods = [
  buildBundle('./src/bundle.ts', './dist/uppy.min.mjs', {
    standalone: 'Uppy (ESM)',
    format: 'esm',
  }),
  buildBundle('./bundle.mjs', './dist/uppy.min.js', {
    standalone: 'Uppy',
    format: 'iife',
  }),
  ...locales.map((locale) =>
    buildBundle(
      `../../packages/@uppy/locales/lib/${locale}.js`,
      `../../packages/@uppy/locales/dist/${locale}.min.js`,
      { standalone: `Uppy Locale ${locale}`, format: 'iife' },
    ),
  ),
]

const bundleReadme = new URL('../../BUNDLE-README.md', import.meta.url)

// Include the bundle instructions in both the downloadable archive and npm package page.
methods.push(
  fs.copyFile(bundleReadme, new URL('./README.md', import.meta.url)),
  fs.copyFile(bundleReadme, new URL('./dist/README.md', import.meta.url)),
)

await Promise.all(methods).then(
  () => {
    console.info(styleText('yellow', '✓ JS bundles 🎉'))
  },
  (err) => {
    console.error(styleText('red', '✗ Error:'), styleText('red', err.message))
  },
)
