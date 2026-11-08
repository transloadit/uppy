import { describe, expect, it, vi } from 'vitest'
import createEmitter from '../../lib/utils/createEmitter.js'

describe('createEmitter', () => {
  it('calls listeners in order, always with six arguments', () => {
    const emitter = createEmitter()
    const calls: unknown[] = []
    emitter.on('a', (...args) => calls.push(['first', args.length, ...args]))
    emitter.on('a', (...args) => calls.push(['second', args.length, ...args]))
    emitter.emit('a', 1, 2, 3, 4, 5, 6, 7)
    emitter.emit('a', 1)
    const u = undefined
    expect(calls).toEqual([
      ['first', 6, 1, 2, 3, 4, 5, 6],
      ['second', 6, 1, 2, 3, 4, 5, 6],
      ['first', 6, 1, u, u, u, u, u],
      ['second', 6, 1, u, u, u, u, u],
    ])
  })

  it('also calls namespace and * listeners, with the event name on the listener', () => {
    const emitter = createEmitter()
    const events: string[] = []
    emitter.on('*', function (this: { event: string }, arg: unknown) {
      events.push(`* ${this.event} ${arg}`)
    })
    emitter.on('thumbnail', function (this: { event: string }, arg: unknown) {
      events.push(`namespace ${this.event} ${arg}`)
    })
    emitter.emit('thumbnail:generated', 'file')
    emitter.emit('upload')
    expect(events).toEqual([
      '* thumbnail:generated file',
      'namespace thumbnail:generated file',
      '* upload undefined',
    ])
  })

  it('removes listeners with once and off', () => {
    const emitter = createEmitter()
    const once = vi.fn()
    const a = vi.fn()
    const b = vi.fn()
    emitter.once('x', once)
    emitter.on('x', a)
    emitter.on('x', b)
    emitter.emit('x')
    emitter.off('x', a)
    emitter.emit('x')
    emitter.off('x')
    emitter.emit('x')
    expect([
      once.mock.calls.length,
      a.mock.calls.length,
      b.mock.calls.length,
    ]).toEqual([1, 1, 2])
  })

  it('off removes a once listener by the function passed to once', () => {
    const emitter = createEmitter()
    const once = vi.fn()
    const other = vi.fn()
    emitter.once('x', once)
    emitter.on('x', other)
    emitter.off('x', once)
    emitter.emit('x')
    expect(once).not.toHaveBeenCalled()
    expect(other).toHaveBeenCalledOnce()
  })

  it('calls * listeners for namespaced events whatever the registration order', () => {
    const emitter = createEmitter()
    const events: string[] = []
    emitter.on('thumbnail', () => events.push('namespace'))
    emitter.on('*', () => events.push('*'))
    emitter.emit('thumbnail:generated')
    expect(events).toEqual(['namespace', '*'])
  })

  it('does not call a listener added during an emit until the next emit', () => {
    const emitter = createEmitter()
    const calls: string[] = []
    emitter.on('x', function first() {
      calls.push('first')
      emitter.on('x', () => calls.push('added'))
    })
    emitter.emit('x')
    expect(calls).toEqual(['first'])
    emitter.emit('x')
    expect(calls).toEqual(['first', 'first', 'added'])
  })

  it('a listener removed during an emit still runs in that emit, as namespace-emitter did', () => {
    const emitter = createEmitter()
    const calls: string[] = []
    const second = () => calls.push('second')
    emitter.on('x', () => {
      calls.push('first')
      emitter.off('x', second)
    })
    emitter.on('x', second)
    emitter.emit('x')
    emitter.emit('x')
    expect(calls).toEqual(['first', 'second', 'first'])
  })
})
