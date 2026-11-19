import Core from '@uppy/core'
import Transloadit from '@uppy/transloadit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Assembly from '../lib/Assembly.js'

// Keep Assembly monitoring and HTTP responses off the network, but exercise
// the real Transloadit, Tus, tus-js-client and shared queue retry logic.
function setup(uppy, options, respond) {
  uppy.use(Transloadit, {
    errorReporting: false,
    limit: 1,
    assemblyOptions: { params: { auth: { key: 'test-key' } } },
    ...options,
  })
  const client = uppy.getPlugin('Transloadit').client
  vi.spyOn(client, 'createAssembly').mockResolvedValue({
    assembly_id: 'test-assembly',
    assembly_url: 'https://api.test/assemblies/test-assembly',
    assembly_ssl_url: 'https://api.test/assemblies/test-assembly',
    tus_url: 'https://tus.test/files/',
    ok: 'ASSEMBLY_UPLOADING',
  })
  vi.spyOn(client, 'cancelAssembly').mockResolvedValue(undefined)

  const attempts = []
  const fileID = uppy.addFile({ name: 'test.txt', data: new Blob(['a']) })
  uppy.setFileState(fileID, {
    tus: {
      httpStack: {
        createRequest(method, url) {
          return {
            getMethod: () => method,
            getURL: () => url,
            setHeader() {},
            getHeader: () => null,
            setProgressHandler() {},
            getUnderlyingObject: () => null,
            abort: () => Promise.resolve(),
            send() {
              attempts.push({ method, time: Date.now() })
              const status = respond(method)
              return Promise.resolve({
                getStatus: () => status,
                getHeader: (name) =>
                  ({
                    Location: 'https://tus.test/files/1',
                    'Upload-Offset': '1',
                  })[name] ?? null,
                getBody: () => '',
                getUnderlyingObject: () => null,
              })
            },
          }
        },
      },
    },
  })
  return attempts
}

describe('Transloadit retry delays', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    vi.spyOn(Assembly.prototype, 'connect').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const defaultTimes = [
    0, 1_000, 3_000, 6_000, 11_000, 21_000, 36_000, 56_000, 86_000,
  ]
  it.each([
    { name: 'default on 503', status: 503, options: {}, times: defaultTimes },
    { name: 'default on 429', status: 429, options: {}, times: defaultTimes },
    {
      name: 'custom on 503',
      status: 503,
      options: { retryDelays: [25, 75] },
      times: [0, 25, 100],
    },
    {
      name: 'custom on 429',
      status: 429,
      options: { retryDelays: [25, 75] },
      times: [0, 25, 100],
    },
    {
      name: 'disabled on 503',
      status: 503,
      options: { retryDelays: [] },
      times: [0],
    },
    {
      name: 'disabled on 429',
      status: 429,
      options: { retryDelays: [] },
      times: [0],
    },
    { name: 'non-retryable 400', status: 400, options: {}, times: [0] },
  ])(
    'uses $name and stops when exhausted',
    async ({ status, options, times }) => {
      using uppy = new Core()
      const attempts = setup(uppy, options, () => status)
      const complete = vi.fn()
      uppy.on('complete', complete)
      const upload = uppy.upload()
      await vi.advanceTimersByTimeAsync(0)
      expect(attempts).toEqual([{ method: 'POST', time: 0 }])

      for (let i = 1; i < times.length; i++) {
        await vi.advanceTimersByTimeAsync(times[i] - times[i - 1] - 1)
        expect(attempts).toHaveLength(i)
        expect(complete).not.toHaveBeenCalled()
        await vi.advanceTimersByTimeAsync(1)
        expect(attempts.map(({ time }) => time)).toEqual(times.slice(0, i + 1))
      }

      const result = await upload
      expect(result.failed).toHaveLength(1)
      expect(result.successful).toHaveLength(0)
      await vi.advanceTimersByTimeAsync(60_000)
      expect(attempts).toHaveLength(times.length)
    },
  )

  it('recovers when a server returns after 80 seconds', async () => {
    using uppy = new Core()
    const attempts = setup(uppy, {}, (method) => {
      if (Date.now() < 80_000) return 502
      return method === 'POST' ? 201 : 204
    })
    const upload = uppy.upload()
    await vi.advanceTimersByTimeAsync(86_000)

    const result = await upload
    expect(result.failed).toHaveLength(0)
    expect(result.successful).toHaveLength(1)
    expect(
      attempts
        .filter(({ method }) => method === 'POST')
        .map(({ time }) => time),
    ).toEqual(defaultTimes)
    expect(attempts.at(-1)).toEqual({ method: 'PATCH', time: 86_000 })
  })
})
