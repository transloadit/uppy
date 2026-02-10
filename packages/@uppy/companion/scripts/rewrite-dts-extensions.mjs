import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

async function walk(dir, onFile) {
  const entries = await readdir(dir, { withFileTypes: true })
  await Promise.all(
    entries.map(async (ent) => {
      const full = join(dir, ent.name)
      if (ent.isDirectory()) return walk(full, onFile)
      if (ent.isFile()) return onFile(full)
      return undefined
    }),
  )
}

const distDir = fileURLToPath(new URL('../dist/', import.meta.url))

await walk(distDir, async (file) => {
  if (!file.endsWith('.d.ts')) return

  const src = await readFile(file, 'utf8')
  const out = src
    // Rewrite relative type imports to match emitted JS layout.
    .replace(
      /(from\s+['"]\.{1,2}\/[^'"]+)\.ts(['"])/g,
      '$1.js$2',
    )
    .replace(
      /(import\s+['"]\.{1,2}\/[^'"]+)\.ts(['"])/g,
      '$1.js$2',
    )
    .replace(
      /(import\(\s*['"]\.{1,2}\/[^'"]+)\.ts(['"]\s*\))/g,
      '$1.js$2',
    )

  if (out !== src) await writeFile(file, out, 'utf8')
})
