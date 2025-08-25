import { describe, expect, it, vi } from 'vitest'
import { AbortController, AbortSignal } from './AbortController.js'

function flushInstantTimeouts() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('AbortController', () => {
  it('has the expected shape', () => {
    const controller = new AbortController()
    expect(typeof controller.abort).toBe('function')
    expect(controller.signal).toBeInstanceOf(AbortSignal)
  })

  it('emits "abort" when abort() is called', async () => {
    const controller = new AbortController()
    const callback = vi.fn()

    controller.signal.addEventListener('abort', callback)
    controller.abort()

    await flushInstantTimeouts()

    expect(callback).toHaveBeenCalled()
    expect(callback.mock.calls[0][0]).toBeInstanceOf(Event)
  })

  it('add and remove events', async () => {
    const controller = new AbortController()
    const callback = vi.fn()
    const callback2 = vi.fn()

    controller.signal.addEventListener('abort', callback)
    controller.signal.addEventListener('abort', callback2)
    controller.signal.removeEventListener('abort', callback)
    controller.abort()

    await flushInstantTimeouts()

    expect(callback2).toHaveBeenCalled()
    expect(callback2.mock.calls[0][0]).toBeInstanceOf(Event)
    expect(callback).not.toHaveBeenCalled()
  })

  it('sets `signal.aborted` property when abort() is called', () => {
    const controller = new AbortController()

    expect(controller.signal.aborted).toBe(false)
    controller.abort()
    expect(controller.signal.aborted).toBe(true)
  })
})
