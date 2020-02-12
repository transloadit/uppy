import DefaultStore = require('../')

const store = DefaultStore()

store.setState({ a: 'b' })
store.getState()
