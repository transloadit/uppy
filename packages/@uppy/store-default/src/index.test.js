const DefaultStore = require('./index')

describe('DefaultStore', () => {
  it('can be created with or without new', () => {
    let store = DefaultStore()
    expect(typeof store).toBe('object')
    store = new DefaultStore()
    expect(typeof store).toBe('object')
  })

  it('merges in state using `setState`', () => {
    const store = DefaultStore()
    expect(store.getState()).toEqual({})

    store.setState({
      a: 1,
      b: 2
    })
    expect(store.getState()).toEqual({ a: 1, b: 2 })

    store.setState({ b: 3 })
    expect(store.getState()).toEqual({ a: 1, b: 3 })
  })

  it('notifies subscriptions when state changes', () => {
    let expected = []
    let calls = 0
    function listener (prevState, nextState, patch) {
      calls++
      expect([ prevState, nextState, patch ]).toEqual(expected)
    }

    const store = DefaultStore()
    store.subscribe(listener)

    expected = [{}, { a: 1, b: 2 }, { a: 1, b: 2 }]
    store.setState({
      a: 1,
      b: 2
    })

    expected = [{ a: 1, b: 2 }, { a: 1, b: 3 }, { b: 3 }]
    store.setState({ b: 3 })

    expect(calls).toBe(2)
  })
})
