#!/usr/bin/env node

/**
 * This script can be used to initiate the transition for a plugin from ESM source to
 * TS source. It will rename the files, update the imports, and add a `tsconfig.json`.
 */

import { opendir, readFile, open, writeFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { argv } from 'node:process'
import { basename, extname, join } from 'node:path'
import { existsSync } from 'node:fs'

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

const uppyDeps = new Set(
  Object.keys(packageJSON.dependencies || {})
    .concat(Object.keys(packageJSON.peerDependencies || {}))
    .concat(Object.keys(packageJSON.devDependencies || {}))
    .filter((pkg) => pkg.startsWith('@uppy/')),
)

// We want TS to check the source files so it doesn't use outdated (or missing) types:
const paths = Object.fromEntries(
  (function* generatePaths() {
    const require = createRequire(packageRoot)
    for (const pkg of uppyDeps) {
      const nickname = pkg.slice('@uppy/'.length)
      // eslint-disable-next-line import/no-dynamic-require
      const pkgJson = require(`../${nickname}/package.json`)
      if (pkgJson.main) {
        yield [
          pkg,
          [`../${nickname}/${pkgJson.main.replace(/^(\.\/)?lib\//, 'src/')}`],
        ]
      }
      yield [`${pkg}/lib/*`, [`../${nickname}/src/*`]]
    }
  })(),
)
const references = Array.from(uppyDeps, (pkg) => ({
  path: `../${pkg.slice('@uppy/'.length)}/tsconfig.build.json`,
}))

const depsNotYetConvertedToTS = references.filter(
  (ref) => !existsSync(new URL(ref.path, packageRoot)),
)

if (depsNotYetConvertedToTS.length) {
  // We need to first convert the dependencies, otherwise we won't be working with the correct types.
  throw new Error('Some dependencies have not yet been converted to TS', {
    cause: depsNotYetConvertedToTS.map((ref) =>
      ref.path.replace(/^\.\./, '@uppy'),
    ),
  })
}

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
    const { name } = dirent
    const ext = extname(name)
    if (ext !== '.js' && ext !== '.jsx') continue // eslint-disable-line no-continue
    const filePath =
      basename(dirent.path) === name ?
        dirent.path // Some versions of Node.js give the full path as dirent.path.
      : join(dirent.path, name) // Others supply only the path to the parent.
    await writeFile(
      `${filePath.slice(0, -ext.length)}${ext.replace('js', 'ts')}`,
      (await readFile(filePath, 'utf-8'))
        .replace(
          // The following regex aims to capture all imports and reexports of local .js(x) files to replace it to .ts(x)
          // It's far from perfect and will have false positives and false negatives.
          /((?:^|\n)(?:import(?:\s+\w+\s+from)?|export\s*\*\s*from|(?:import|export)\s*(?:\{[^}]*\}|\*\s*as\s+\w+\s)\s*from)\s*["']\.\.?\/[^'"]+\.)js(x?["'])/g, // eslint-disable-line max-len
          '$1ts$2',
        )
        .replace(
          // The following regex aims to capture all local package.json imports.
          /\nimport \w+ from ['"]..\/([^'"]+\/)*package.json['"]\n/g,
          (originalImport) =>
            `\n// eslint-disable-next-line @typescript-eslint/ban-ts-comment\n` +
            `// @ts-ignore We don't want TS to generate types for the package.json${originalImport}`,
        ),
    )
    await rm(filePath)
  }
}

await tsConfig.writeFile(
  `${JSON.stringify(
    {
      extends: '../../../tsconfig.shared',
      compilerOptions: {
        emitDeclarationOnly: false,
        noEmit: true,
        paths,
      },
      include: ['./package.json', './src/**/*.*'],
      references,
    },
    undefined,
    2,
  )}\n`,
)

await tsConfig.close()

await writeFile(
  new URL('./tsconfig.build.json', packageRoot),
  `${JSON.stringify(
    {
      extends: '../../../tsconfig.shared',
      compilerOptions: {
        noImplicitAny: false,
        outDir: './lib',
        paths,
        resolveJsonModule: false,
        rootDir: './src',
        skipLibCheck: true,
      },
      include: ['./src/**/*.*'],
      exclude: ['./src/**/*.test.ts'],
      references,
    },
    undefined,
    2,
  )}\n`,
)

console.log('Done')
