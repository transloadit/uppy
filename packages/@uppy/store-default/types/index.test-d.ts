import DefaultStore from '..'

const store = new DefaultStore()

store.setState({ a: 'b' })
store.getState()
