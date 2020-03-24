import { createStore, combineReducers } from 'redux'
import ReduxStore = require('../')

const reducer = combineReducers({
  uppy: ReduxStore.reducer
})

const store = ReduxStore({
  store: createStore(reducer)
})

store.setState({ a: 1 })
store.getState()
