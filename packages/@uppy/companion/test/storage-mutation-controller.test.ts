import { expect, test, vi } from 'vitest'
import { mutate } from '../src/server/controllers/index.js'

test.each([
  { parentId: 42 },
  { parentId: {} },
  { parentId: [] },
])('rejects invalid folder parents without writing at root (%j)', async ({
  parentId,
}) => {
  const write = vi.fn()
  const sendStatus = vi.fn()
  // Only the fields the preceding middleware guarantees are needed here.
  await mutate(
    {
      params: { operation: 'create-folder' },
      companion: { provider: { createFolder: write } },
      body: { name: 'photos', parentId },
    } as never,
    { sendStatus, json: vi.fn() } as never,
    vi.fn(),
  )
  expect(sendStatus).toHaveBeenCalledWith(400)
  expect(write).not.toHaveBeenCalled()
})
