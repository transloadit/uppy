import { expect, test, vi } from 'vitest'
import { createFolder } from '../dist/server/controllers/mutate.js'

test.each([
  { parentId: 42 },
  { parentId: {} },
  { parentId: [] },
])('rejects invalid folder parents without writing at root (%j)', async ({
  parentId,
}) => {
  const write = vi.fn()
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  // Only the fields supplied by Companion's preceding middleware are needed by this controller.
  await createFolder(
    {
      companion: {
        provider: { createFolder: write },
        providerClass: { supportsMutations: true },
      },
      body: { name: 'photos', parentId },
    } as never,
    { status, json } as never,
    vi.fn(),
  )
  expect(status).toHaveBeenCalledWith(400)
  expect(write).not.toHaveBeenCalled()
})
