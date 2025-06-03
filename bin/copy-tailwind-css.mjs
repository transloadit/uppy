#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// todo merge this with build-css.js?

// Get the directory of this script
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')

// Copy CSS file
const CSS_SOURCE_PATH = path.join(
  rootDir,
  'packages/@uppy/components/dist/styles.css',
)
const FRAMEWORK_DIRS_FOR_CSS = [
  'packages/@uppy/react/dist',
  'packages/@uppy/vue/dist',
  'packages/@uppy/svelte/dist',
]

await fs.access(CSS_SOURCE_PATH) // Check if source CSS exists
await Promise.all(
  FRAMEWORK_DIRS_FOR_CSS.map(async (destDir) => {
    const destDirPath = path.join(rootDir, destDir)
    await fs.mkdir(destDirPath, { recursive: true })
    const destPath = path.join(destDirPath, 'styles.css')
    await fs.copyFile(CSS_SOURCE_PATH, destPath)
  }),
)
