import { test as testBase } from 'vitest'
import { worker } from './mocks/browser.js'

export const test = testBase.extend<{ worker: typeof worker }>({
  worker: [
    // biome-ignore lint/correctness/noEmptyPattern: dunno
    async ({}, use) => {
      // Start the worker before the test.
      await worker.start()

      // Expose the worker object on the test's context.
      await use(worker)

      // Remove any request handlers added in individual test cases.
      // This prevents them from affecting unrelated tests.
      worker.resetHandlers()
    },
    {
      auto: true,
    },
  ],
})
