/// <reference types="msw/vite/client" />

// Enables MSW network mocking for the importing browser test file (needs the
// `msw()` Vite plugin). Tests add handlers with `network.use()`; file-wide
// defaults go through `network.resetHandlers(...handlers)` so they survive the
// reset after each test.
import { network } from 'virtual:msw'
import { afterEach } from 'vitest'

network.configure({
  context: { quiet: true },
  // An unmocked request must fail the test rather than escape to the network.
  onUnhandledFrame: 'error',
})
await network.enable()

afterEach(() => {
  network.resetHandlers()
})
