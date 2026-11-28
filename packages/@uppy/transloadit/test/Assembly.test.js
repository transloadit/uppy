import { RateLimitedQueue } from '@uppy/core/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Assembly from '../lib/Assembly.js'

describe('Transloadit/Assembly', () => {
  describe('status diffing', () => {
    function attemptDiff(prev, next) {
      const assembly = new Assembly(prev, new RateLimitedQueue())
      // Lifecycle events fire once per assembly, so let it see `prev` first.
      assembly.updateStatus(prev)
      const events = []
      assembly.emit = vi.fn((name, ...args) => {
        events.push([name, ...args])
      })

      assembly.updateStatus(next)

      return events
    }

    it('ASSEMBLY_UPLOADING → ASSEMBLY_EXECUTING', () => {
      const result = attemptDiff(
        {
          ok: 'ASSEMBLY_UPLOADING',
          uploads: {},
          results: {},
        },
        {
          ok: 'ASSEMBLY_EXECUTING',
          uploads: {},
          results: {},
        },
      )

      expect(result[0]).toEqual(['executing'])
    })

    it('ASSEMBLY_EXECUTING → ASSEMBLY_COMPLETED', () => {
      const result = attemptDiff(
        {
          ok: 'ASSEMBLY_EXECUTING',
          uploads: {},
          results: {},
        },
        {
          ok: 'ASSEMBLY_COMPLETED',
          uploads: {},
          results: {},
        },
      )

      expect(result[0]).toEqual(['finished'])
    })

    it('ASSEMBLY_UPLOADING → ASSEMBLY_COMPLETED', () => {
      const result = attemptDiff(
        {
          ok: 'ASSEMBLY_UPLOADING',
          uploads: {},
          results: {},
        },
        {
          ok: 'ASSEMBLY_COMPLETED',
          uploads: {},
          results: {},
        },
      )

      expect(result[0]).toEqual(['executing'])
      expect(result[1]).toEqual(['metadata'])
      expect(result[2]).toEqual(['finished'])
    })

    it('emits events for new files', () => {
      const result = attemptDiff(
        {
          ok: 'ASSEMBLY_UPLOADING',
          uploads: {},
          results: {},
        },
        {
          ok: 'ASSEMBLY_UPLOADING',
          uploads: {
            some_id: { id: 'some_id' },
          },
          results: {},
        },
      )

      expect(result[0]).toEqual(['upload', { id: 'some_id' }])
    })

    it('emits executing, then upload, on new files + status change', () => {
      const result = attemptDiff(
        {
          ok: 'ASSEMBLY_UPLOADING',
          uploads: {},
          results: {},
        },
        {
          ok: 'ASSEMBLY_EXECUTING',
          uploads: {
            some_id: { id: 'some_id' },
          },
          results: {},
        },
      )

      expect(result[0]).toEqual(['executing'])
      expect(result[1]).toEqual(['upload', { id: 'some_id' }])
      expect(result[2]).toEqual(['metadata'])
    })

    it('emits new results', () => {
      const one = {
        ok: 'ASSEMBLY_EXECUTING',
        uploads: {
          cool_video: { id: 'cool_video' },
        },
        results: {},
      }
      const two = {
        ok: 'ASSEMBLY_EXECUTING',
        uploads: {
          cool_video: { id: 'cool_video' },
        },
        results: {
          step_one: [{ id: 'thumb1' }, { id: 'thumb2' }, { id: 'thumb3' }],
        },
      }
      const three = {
        ok: 'ASSEMBLY_EXECUTING',
        uploads: {
          cool_video: { id: 'cool_video' },
        },
        results: {
          step_one: [
            { id: 'thumb1' },
            { id: 'thumb2' },
            { id: 'thumb3' },
            { id: 'thumb4' },
          ],
          step_two: [{ id: 'transcript' }],
        },
      }

      const resultOne = attemptDiff(one, two)
      const resultTwo = attemptDiff(two, three)

      expect(resultOne[0]).toEqual(['result', 'step_one', { id: 'thumb1' }])
      expect(resultOne[1]).toEqual(['result', 'step_one', { id: 'thumb2' }])
      expect(resultOne[2]).toEqual(['result', 'step_one', { id: 'thumb3' }])

      expect(resultTwo[0]).toEqual(['result', 'step_one', { id: 'thumb4' }])
      expect(resultTwo[1]).toEqual(['result', 'step_two', { id: 'transcript' }])
    })

    it('emits correctly jumping straight from uploading to finished', () => {
      const start = {
        ok: 'ASSEMBLY_UPLOADING',
        uploads: {},
        results: {},
      }
      const end = {
        ok: 'ASSEMBLY_COMPLETED',
        uploads: {
          cool_video: { id: 'cool_video' },
        },
        results: {
          step_one: [
            { id: 'thumb1' },
            { id: 'thumb2' },
            { id: 'thumb3' },
            { id: 'thumb4' },
          ],
          step_two: [{ id: 'transcript' }],
        },
      }

      const result = attemptDiff(start, end)

      expect(result[0]).toEqual(['executing'])
      expect(result[1]).toEqual(['upload', { id: 'cool_video' }])
      expect(result[2]).toEqual(['metadata'])
      expect(result[3]).toEqual(['result', 'step_one', { id: 'thumb1' }])
      expect(result[4]).toEqual(['result', 'step_one', { id: 'thumb2' }])
      expect(result[5]).toEqual(['result', 'step_one', { id: 'thumb3' }])
      expect(result[6]).toEqual(['result', 'step_one', { id: 'thumb4' }])
      expect(result[7]).toEqual(['result', 'step_two', { id: 'transcript' }])
      expect(result[8]).toEqual(['finished'])
    })
  })

  describe('live status', () => {
    class FakeEventSource {
      static last

      #listeners = {}

      constructor() {
        FakeEventSource.last = this
      }

      addEventListener(type, fn) {
        this.#listeners[type] ??= []
        this.#listeners[type].push(fn)
      }

      dispatch(type, data) {
        for (const fn of this.#listeners[type] ?? []) fn({ data })
      }

      close() {}
    }

    afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    })

    function connect(status) {
      vi.stubGlobal('EventSource', FakeEventSource)
      const assembly = new Assembly(
        { assembly_id: 'a', websocket_url: 'ws://localhost', ...status },
        new RateLimitedQueue(),
      )
      assembly.connect()
      return assembly
    }

    it('keeps one polling timer across repeated errors and stops it on reopen', () => {
      vi.useFakeTimers()
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(Response.json(executing)),
      )
      const assembly = connect(executing)
      const source = FakeEventSource.last
      try {
        const initialPoll = assembly.pollInterval
        assembly.connect()
        expect(FakeEventSource.last).toBe(source)
        source.dispatch('error')
        expect(assembly.pollInterval).toBe(initialPoll)
        expect(vi.getTimerCount()).toBe(1)

        source.dispatch('open')
        expect(vi.getTimerCount()).toBe(0)

        source.dispatch('error')
        const resumedPoll = assembly.pollInterval
        expect(resumedPoll).not.toBeNull()
        source.dispatch('error')
        expect(assembly.pollInterval).toBe(resumedPoll)
        expect(vi.getTimerCount()).toBe(1)

        source.dispatch('open')
        expect(assembly.pollInterval).toBeNull()
        expect(vi.getTimerCount()).toBe(0)
      } finally {
        assembly.close()
      }
    })

    const executing = {
      ok: 'ASSEMBLY_EXECUTING',
      assembly_ssl_url: 'https://example.test/assemblies/a',
      results: {},
    }

    it('retries a temporary status failure after losing a live stream', async () => {
      vi.useFakeTimers()
      const fetch = vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 503 }))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(
          Response.json({ ...executing, ok: 'ASSEMBLY_COMPLETED' }),
        )
      vi.stubGlobal('fetch', fetch)
      const assembly = connect(executing)
      const finished = vi.fn()
      const failed = vi.fn()
      assembly.on('finished', finished)
      assembly.on('error', failed)
      try {
        FakeEventSource.last.dispatch('open')
        FakeEventSource.last.dispatch('error')
        await vi.advanceTimersByTimeAsync(6000)

        expect(fetch).toHaveBeenCalledTimes(3)
        await vi.waitFor(() => expect(finished).toHaveBeenCalledTimes(1))
        expect(failed).not.toHaveBeenCalled()
        expect(assembly.pollInterval).toBeNull()
      } finally {
        assembly.close()
      }
    })

    it('observes completion missed during a successful reconnect before the first poll', async () => {
      vi.useFakeTimers()
      const fetch = vi
        .fn()
        .mockResolvedValue(
          Response.json({ ...executing, ok: 'ASSEMBLY_COMPLETED' }),
        )
      vi.stubGlobal('fetch', fetch)
      const assembly = connect(executing)
      const finished = vi.fn()
      assembly.on('finished', finished)
      try {
        const source = FakeEventSource.last
        source.dispatch('open')
        source.dispatch('error')
        source.dispatch('open')
        await vi.advanceTimersByTimeAsync(0)

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(assembly.pollInterval).toBeNull()
        await vi.waitFor(() => expect(finished).toHaveBeenCalledTimes(1))
      } finally {
        assembly.close()
      }
    })

    it('preserves a newer stream result and only emits a polled result once', async () => {
      vi.useFakeTimers()
      const initialPoll = Promise.withResolvers()
      const reconnectRead = Promise.withResolvers()
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockReturnValueOnce(initialPoll.promise)
          .mockReturnValueOnce(reconnectRead.promise),
      )
      const assembly = connect(executing)
      const result = vi.fn()
      assembly.on('result', result)
      const streamed = { id: 'streamed' }
      const polled = { id: 'polled' }
      const source = FakeEventSource.last
      try {
        source.dispatch('open')
        source.dispatch('error')
        await vi.advanceTimersByTimeAsync(2000)
        source.dispatch('open')
        source.dispatch(
          'assembly_result_finished',
          JSON.stringify(['step', streamed]),
        )
        initialPoll.resolve(
          Response.json({ ...executing, results: { step: [polled] } }),
        )
        await vi.waitFor(() =>
          expect(result).toHaveBeenCalledWith('step', polled),
        )
        source.dispatch(
          'assembly_result_finished',
          JSON.stringify(['step', polled]),
        )

        expect(assembly.status.results.step).toHaveLength(2)
        expect(assembly.status.results.step).toEqual(
          expect.arrayContaining([streamed, polled]),
        )
        expect(result.mock.calls).toEqual([
          ['step', streamed],
          ['step', polled],
        ])
      } finally {
        assembly.close()
        initialPoll.resolve(Response.json(executing))
        reconnectRead.resolve(Response.json(executing))
      }
    })

    it('advances ok to ASSEMBLY_EXECUTING when SSE says uploading finished', () => {
      const assembly = connect({ ok: 'ASSEMBLY_UPLOADING' })
      const seen = []
      assembly.on('status', (status) => seen.push(status.ok))

      FakeEventSource.last.dispatch('message', 'assembly_uploading_finished')
      assembly.close()

      expect(assembly.status.ok).toBe('ASSEMBLY_EXECUTING')
      expect(seen).toEqual(['ASSEMBLY_EXECUTING'])
    })

    it('only advances from ASSEMBLY_UPLOADING', () => {
      for (const status of [
        { ok: 'ASSEMBLY_COMPLETED' },
        { ok: 'ASSEMBLY_CANCELED' },
        { ok: 'ASSEMBLY_REPLAYING' },
        { error: 'ASSEMBLY_CRASHED', message: 'boom' },
      ]) {
        const assembly = connect(status)

        FakeEventSource.last.dispatch('message', 'assembly_uploading_finished')
        assembly.close()

        expect(assembly.status.ok).toBe(status.ok)
        expect(assembly.status.error).toBe(status.error)
      }
    })

    it('emits executing and metadata once when SSE and a poll both report them', () => {
      const base = { uploads: {}, results: {} }
      const assembly = connect({ ...base, ok: 'ASSEMBLY_UPLOADING' })
      const events = []
      for (const name of ['executing', 'metadata']) {
        assembly.on(name, () => events.push(name))
      }

      FakeEventSource.last.dispatch('message', 'assembly_uploading_finished')
      assembly.updateStatus({ ...base, ok: 'ASSEMBLY_EXECUTING' })
      FakeEventSource.last.dispatch(
        'message',
        'assembly_upload_meta_data_extracted',
      )
      assembly.close()

      expect(events).toEqual(['executing', 'metadata'])
    })

    it('still emits metadata from a poll when SSE drops before its marker', () => {
      // `waitForMetadata` uploads complete off 'metadata' alone.
      const base = { uploads: {}, results: {} }
      const assembly = connect({ ...base, ok: 'ASSEMBLY_UPLOADING' })
      const events = []
      for (const name of ['executing', 'metadata', 'finished']) {
        assembly.on(name, () => events.push(name))
      }

      FakeEventSource.last.dispatch('message', 'assembly_uploading_finished')
      assembly.updateStatus({ ...base, ok: 'ASSEMBLY_COMPLETED' })
      assembly.close()

      expect(events).toEqual(['executing', 'metadata', 'finished'])
    })

    it('emits metadata for an assembly first seen executing', () => {
      // No crossing into EXECUTING is ever observed here, so deriving
      // 'metadata' from the transition would emit nothing and strand a
      // `waitForMetadata` upload. Approximating it from the status instead
      // means it can precede `assembly_upload_meta_data_extracted`.
      const base = { uploads: {}, results: {} }
      const assembly = new Assembly(
        { ...base, ok: 'ASSEMBLY_EXECUTING' },
        new RateLimitedQueue(),
      )
      const events = []
      for (const name of ['executing', 'metadata', 'finished']) {
        assembly.on(name, () => events.push(name))
      }

      assembly.updateStatus({ ...base, ok: 'ASSEMBLY_EXECUTING' })

      expect(events).toEqual(['executing', 'metadata'])
    })

    it('emits no status from an errored polling update', () => {
      // #diffStatus routes the errored status through #onError, which closes
      // the assembly; updateStatus must not store it on a closed assembly.
      const base = { uploads: {}, results: {} }
      const assembly = new Assembly(
        { ...base, ok: 'ASSEMBLY_EXECUTING' },
        new RateLimitedQueue(),
      )
      const events = []
      assembly.on('status', () => events.push('status'))
      assembly.on('error', () => events.push('error'))

      assembly.updateStatus({
        ...base,
        error: 'ASSEMBLY_CRASHED',
        message: 'boom',
      })

      expect(events).toEqual(['error'])
      expect(assembly.closed).toBe(true)
    })

    it('keeps polling after a status fetch throws', async () => {
      const fetch = vi.fn().mockRejectedValue(new TypeError('offline'))
      vi.stubGlobal('fetch', fetch)
      const assembly = new Assembly(
        { ok: 'ASSEMBLY_EXECUTING', assembly_ssl_url: 'https://x/a' },
        new RateLimitedQueue(),
      )
      assembly.on('error', () => {})

      await assembly.update()
      assembly.closed = false
      await assembly.update()

      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('keeps progress_combined when a full status replaces it', () => {
      const base = { ok: 'ASSEMBLY_EXECUTING', uploads: {}, results: {} }
      const assembly = new Assembly(base, new RateLimitedQueue())
      assembly.status = { ...base, progress_combined: 42 }

      assembly.updateStatus({ ...base })

      expect(assembly.status.progress_combined).toBe(42)
    })

    it('drops progress_combined once the assembly is no longer executing', () => {
      const base = { ok: 'ASSEMBLY_EXECUTING', uploads: {}, results: {} }
      const assembly = new Assembly(base, new RateLimitedQueue())
      assembly.status = { ...base, progress_combined: 42 }

      assembly.updateStatus({ ...base, ok: 'ASSEMBLY_COMPLETED' })

      expect(assembly.status.progress_combined).toBeUndefined()
    })
  })
})
