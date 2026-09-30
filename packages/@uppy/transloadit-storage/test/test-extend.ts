import { setupWorker } from 'msw/browser'
import { test as testBase } from 'vitest'

const worker = setupWorker()

export const it = testBase.extend(
  'worker',
  { auto: true },
  // biome-ignore lint/correctness/noEmptyPattern: Vitest requires destructured fixtures.
  async ({}, { onCleanup }) => {
    await worker.start({ quiet: true, onUnhandledRequest: 'error' })
    onCleanup(() => worker.resetHandlers())
    return worker
  },
)
