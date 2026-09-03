import { readdir, readFile } from 'node:fs/promises'
import { expect, test } from 'vitest'

const ignore = ['angular', 'svelte']

const projectRoot = new URL('../../../', import.meta.url)

const packages = (await readdir(new URL('packages/@uppy/', projectRoot)))
  .filter((name) => !ignore.includes(name))
  .sort()

async function readJSON(path: string): Promise<any> {
  return JSON.parse(await readFile(new URL(path, projectRoot), 'utf8'))
}

test('tsconfig.json', async () => {
  const tsconfig = await readJSON('tsconfig.json')
  expect(tsconfig).toStrictEqual({
    files: [],
    references: [
      ...packages.map((name) => ({
        path: `./packages/@uppy/${name}/tsconfig.json`,
      })),
      './packages/uppy/tsconfig.json',
    ],
  })
})

test.each(packages)('packages/@uppy/%s/tsconfig.build.json', async (name) => {
  const pkg = await readJSON(`packages/@uppy/${name}/package.json`)
  const tsconfigBuild = await readJSON(
    `packages/@uppy/${name}/tsconfig.build.json`,
  )

  let expected: unknown[] | undefined
  if (pkg.dependencies || pkg.devDependencies || pkg.peerDependencies) {
    const deps = Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    })
      .filter((dep) => dep.startsWith('@uppy'))
      .sort()

    if (deps.length) {
      expected = deps.map((dep) => ({
        path: `../${dep.replace(/^@uppy\//, '')}/tsconfig.build.json`,
      }))
    }
  }

  expect(tsconfigBuild.extends).toBe('@uppy-dev/tsconfig/build')
  expect(tsconfigBuild.references).toStrictEqual(expected)
})

test.each(packages)('packages/@uppy/%s/tsconfig.json', async (name) => {
  const tsconfigBuild = await readJSON(`packages/@uppy/${name}/tsconfig.json`)

  expect(tsconfigBuild.extends).toBe('@uppy-dev/tsconfig')
  expect(tsconfigBuild.references).toStrictEqual([
    { path: './tsconfig.build.json' },
  ])
})
