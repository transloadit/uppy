import { setupWorker } from 'msw/browser'
import { test as testBase } from 'vitest'

const worker = setupWorker()

export const test = testBase.extend(
  'worker',
  { auto: true },
  // biome-ignore lint/correctness/noEmptyPattern: We must destructure when a extending test base
  async ({}, { onCleanup }) => {
    await worker.start({ quiet: true })
    onCleanup(() => worker.resetHandlers())
    return worker
  },
)
