import { createStore, combineReducers } from 'redux';
import Uppy = require('@uppy/core');
import ReduxStore = require('../');

const reducer = combineReducers({
  uppy: ReduxStore.reducer
});

const store = ReduxStore({
  store: createStore(reducer)
});

Uppy({ store });
