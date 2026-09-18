import { RateLimitedQueue } from '@uppy/core/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Assembly from '../lib/Assembly.js'

describe('Transloadit/Assembly', () => {
  describe('status diffing', () => {
    function attemptDiff(prev, next) {
      const assembly = new Assembly(prev, new RateLimitedQueue())
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

    it('folds an SSE error envelope into the status before emitting error', () => {
      const assembly = connect({ ok: 'ASSEMBLY_EXECUTING' })
      const events = []
      assembly.on('status', (status) => events.push(['status', status.error]))
      assembly.on('error', (error) => events.push(['error', error.error]))

      FakeEventSource.last.dispatch(
        'assembly_error',
        JSON.stringify({ error: 'ASSEMBLY_CRASHED', message: 'boom' }),
      )

      expect(assembly.closed).toBe(true)
      expect(assembly.status.error).toBe('ASSEMBLY_CRASHED')
      expect(assembly.status.message).toBe('boom')
      expect(events).toEqual([
        ['status', 'ASSEMBLY_CRASHED'],
        ['error', 'ASSEMBLY_CRASHED'],
      ])
    })

    it('keeps progress_combined when a full status replaces it', () => {
      const base = { ok: 'ASSEMBLY_EXECUTING', uploads: {}, results: {} }
      const assembly = new Assembly(base, new RateLimitedQueue())
      assembly.status = { ...base, progress_combined: 42 }

      assembly.updateStatus({ ...base })

      expect(assembly.status.progress_combined).toBe(42)
    })
  })
})
