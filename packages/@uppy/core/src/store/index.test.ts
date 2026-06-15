import assert from 'node:assert'
import { describe, expect, it } from 'vitest'
import DefaultStore, { type GenericState, type Listener } from './index.js'

describe('DefaultStore', () => {
  it('cannot be created without new', () => {
    // @ts-expect-error TypeScript warns us that the following will throw.
    assert.throws(() => DefaultStore(), /TypeError/)
  })

  it('merges in state using `setState`', () => {
    const store = new DefaultStore()
    expect(store.getState()).toEqual({})

    store.setState({
      a: 1,
      b: 2,
    })
    expect(store.getState()).toEqual({ a: 1, b: 2 })

    store.setState({ b: 3 })
    expect(store.getState()).toEqual({ a: 1, b: 3 })
  })

  it('notifies subscriptions when state changes', () => {
    let expected: GenericState[] = []
    let calls = 0
    function listener(...args: Parameters<Listener<GenericState>>): void {
      calls++
      expect(args).toEqual(expected)
    }

    const store = new DefaultStore()
    store.subscribe(listener)

    expected = [{}, { a: 1, b: 2 }, { a: 1, b: 2 }]
    store.setState({
      a: 1,
      b: 2,
    })

    expected = [{ a: 1, b: 2 }, { a: 1, b: 3 }, { b: 3 }]
    store.setState({ b: 3 })

    expect(calls).toBe(2)
  })
})
