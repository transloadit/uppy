import '@uppy-dev/msw-setup'

import { network } from 'virtual:msw'
import { RateLimitedQueue } from '@uppy/core/utils'
import { HttpResponse, http } from 'msw'
import { expect, it, vi } from 'vitest'

import Assembly from '../lib/Assembly.js'

it.each(['ASSEMBLY_COMPLETED', 'ASSEMBLY_CANCELED'] as const)(
  'observes %s by polling when EventSource reconnects and receives HTTP 503',
  { timeout: 10_000 },
  async (terminalStatus) => {
    const streamUrl = new URL('/test/assembly-stream', location.origin).href
    const statusUrl = new URL('/test/assemblies/a', location.origin).href
    const disconnect = Promise.withResolvers<void>()
    const executing = {
      assembly_id: 'a',
      ok: 'ASSEMBLY_EXECUTING' as const,
      websocket_url: streamUrl,
      assembly_ssl_url: statusUrl,
    }
    const terminal = { ...executing, ok: terminalStatus }
    const stream = vi.fn(() => {
      if (stream.mock.calls.length > 1) {
        return new HttpResponse(null, {
          status: 503,
          headers: { 'Retry-After': '1' },
        })
      }
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('retry: 50\ndata: ping\n\n'),
          )
          return disconnect.promise.then(() => controller.close())
        },
      })
      return new HttpResponse(body, {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    })
    const status = vi.fn(() => HttpResponse.json(terminal))
    network.use(http.get(streamUrl, stream), http.get(statusUrl, status))

    const assembly = new Assembly(executing, new RateLimitedQueue())
    const finished = vi.fn()
    assembly.on('finished', finished)
    try {
      assembly.connect()
      await expect.poll(() => assembly.pollInterval).toBeNull()
      expect(status).toHaveBeenCalledTimes(0)
      disconnect.resolve()
      await expect.poll(() => stream.mock.calls.length).toBe(2)
      await expect
        .poll(() => finished.mock.calls.length, { timeout: 5000 })
        .toBe(1)
      expect(status).toHaveBeenCalledTimes(1)
      expect(assembly.status).toEqual(terminal)
      expect(assembly.pollInterval).toBeNull()
    } finally {
      disconnect.resolve()
      assembly.close()
    }
  },
)
