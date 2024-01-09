import { readFile, writeFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile('packages/uppy/package.json'))
pkg.overrides = {}
for (const key of Object.keys(pkg.dependencies)) {
  const match = key.match(/^@uppy\/(.+)$/)
  if (match) {
    pkg.overrides[key] = `/tmp/artifacts/@uppy-${match[1]}-${process.argv[2]}.tgz`
    pkg.dependencies[key] = pkg.overrides[key]
  }
}
await writeFile('packages/uppy/package.json', JSON.stringify(pkg, null, 2))