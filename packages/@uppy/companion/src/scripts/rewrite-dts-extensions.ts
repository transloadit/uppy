import fs from 'node:fs'
import path from 'node:path'

function walk(dir: string, out: string[]): void {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      walk(p, out)
      continue
    }
    if (ent.isFile() && p.endsWith('.d.ts')) out.push(p)
  }
}

function rewriteDtsFile(file: string): boolean {
  const input = fs.readFileSync(file, 'utf8')
  const output = input.replace(
    /(['"])(\.{1,2}\/[^'"]+)\.ts\1/g,
    (_m, quote: string, rel: string) => `${quote}${rel}.js${quote}`,
  )
  if (output === input) return false
  fs.writeFileSync(file, output)
  return true
}

const distDir = path.resolve(import.meta.dirname, '../../dist')
if (!fs.existsSync(distDir)) {
  // Nothing to do (e.g. running in a context where dist isn't built yet).
  process.exit(0)
}

const files: string[] = []
walk(distDir, files)

let changed = 0
for (const file of files) {
  if (rewriteDtsFile(file)) changed += 1
}

// eslint-disable-next-line no-console
console.log(`rewrite-dts-extensions: updated ${changed} .d.ts file(s)`)

