import { HttpResponse, http } from 'msw'
import { setupWorker } from 'msw/browser'
import { test as testBase } from 'vitest'

const worker = setupWorker(
  // Transloadit reports client-side upload failures to this endpoint. Several
  // tests deliberately fail an upload, so mock it to keep the beacon from
  // reaching the real service.
  http.post('https://transloaditstatus.com/client_error', () =>
    HttpResponse.json({ ok: true }),
  ),
)

export const it = testBase.extend(
  'worker',
  { auto: true },
  // biome-ignore lint/correctness/noEmptyPattern: We must destructure when a extending test base
  async ({}, { onCleanup }) => {
    // `error` matches the strictness of the `msw/node` setup this replaced: an
    // unmocked request must fail the test rather than escape to the network.
    await worker.start({ quiet: true, onUnhandledRequest: 'error' })
    onCleanup(() => worker.resetHandlers())
    return worker
  },
)
