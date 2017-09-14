import { createStore } from 'redux'
import reducers from './Reducers'

export const init = () => {
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

  return createStore(reducers, initialState, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())
}
