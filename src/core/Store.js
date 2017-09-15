import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import reducers from './Reducers'

export const init = (uppy) => {
  const initialState = {
    files: {},
    capabilities: {
      resumableUploads: false
    },
    totalProgress: 0,
    meta: {},
    info: {
      isHidden: true,
      type: 'info',
      message: ''
    }
  }

  return createStore(reducers, initialState, compose(
      applyMiddleware(thunk.withExtraArgument({ uppy })),
      window.devToolsExtension ? window.devToolsExtension() : f => f
    ))
}
