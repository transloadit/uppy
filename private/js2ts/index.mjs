#!/usr/bin/env node

/**
 * This script can be used to initiate the transition for a plugin from ESM source to
 * TS source. It will rename the files, update the imports, and add a `tsconfig.json`.
 */

import { opendir, readFile, open, writeFile, rm } from 'node:fs/promises'
import { argv } from 'node:process'
import { extname } from 'node:path'

const packageRoot = new URL(`../../packages/${argv[2]}/`, import.meta.url)
let dir

try {
  dir = await opendir(new URL('./src/', packageRoot), { recursive: true })
} catch (cause) {
  throw new Error(`Unable to find package "${argv[2]}"`, { cause })
}
const packageJSON = JSON.parse(
  await readFile(new URL('./package.json', packageRoot), 'utf-8'),
)

if (packageJSON.type !== 'module') {
  throw new Error('Cannot convert non-ESM package to TS')
}

const references = Object.keys(packageJSON.dependencies || {})
  .concat(Object.keys(packageJSON.peerDependencies || {}))
  .filter((pkg) => pkg.startsWith('@uppy/'))
  .map((pkg) => ({ path: `../${pkg.slice('@uppy/'.length)}` }))

let tsConfig
try {
  tsConfig = await open(new URL('./tsconfig.json', packageRoot), 'wx')
} catch (cause) {
  throw new Error('It seems this package has already been transitioned to TS', {
    cause,
  })
}

for await (const dirent of dir) {
  if (!dirent.isDirectory()) {
    const { path: filepath } = dirent
    const ext = extname(filepath)
    await writeFile(
      filepath.replace(ext, ext.replace('js', 'ts')),
      (await readFile(filepath, 'utf-8')).replace(
        /((?:^|\n)import[^\n]*["']\.\.?\/[^'"]+\.)js(x?["'])/g,
        '$1ts$2',
      ),
    )
    await rm(filepath)
  }
}

await tsConfig.writeFile(
  `${JSON.stringify(
    {
      extends: '../../../tsconfig.shared',
      compilerOptions: {
        emitDeclarationOnly: false,
        noEmit: true,
      },
      include: ['./package.json', './src/**/*.'],
      references,
    },
    undefined,
    2,
  )}\n`,
)

await tsConfig.close()

await writeFile(
  new URL('./tsconfig.build.json', import.meta.url),
  `${JSON.stringify(
    {
      extends: '../../../tsconfig.shared',
      compilerOptions: {
        outDir: './lib',
        rootDir: './src',
        resolveJsonModule: false,
        noImplicitAny: false,
        skipLibCheck: true,
      },
      include: ['./src/**/*.'],
      exclude: ['./src/**/*.test.ts'],
      references,
    },
    undefined,
    2,
  )}\n`,
)

console.log('Done')
