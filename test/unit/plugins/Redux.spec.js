import test from 'tape'
import ee from 'namespace-emitter'

import Redux from '../../../src/plugins/Redux'

test('Redux plugin: default options', function (t) {
  let redux = new Redux()

  t.equal(typeof redux.opts.action, 'function', 'action defaults to function')
  t.equal(typeof redux.opts.dispatch, 'function', 'dispatch defaults to function')

  t.end()
})

test('Redux plugin: options', function (t) {
  const actionFunction = () => {}
  const dispatchFunction = () => {}
  let redux = new Redux(null, { action: actionFunction, dispatch: dispatchFunction })

  t.equal(redux.opts.action, actionFunction, 'action function can be overridden')
  t.equal(redux.opts.dispatch, dispatchFunction, 'dispatch function can be overridden')

  t.end()
})

test('Redux plugin: On load, dispatch redux action with state', function (t) {
  let firstDispatchedEvent = null
  const actionFunction = (prev, curr, patch) => {
    return {
      type: 'STATE_UPDATED',
      prev,
      curr,
      patch
    }
  }
  const dispatchFunction = (action) => {
    firstDispatchedEvent = action
  }
  const core = {
    emitter: ee(),
    state: {
      a: 'b',
      c: 'd'
    }
  }

  let redux = new Redux(core, { action: actionFunction, dispatch: dispatchFunction })
  redux.install() // install the plugin

  t.deepEqual(firstDispatchedEvent, {
    type: 'STATE_UPDATED',
    prev: {},
    curr: {a: 'b', c: 'd'},
    patch: {a: 'b', c: 'd'}
  }, 'Dispatched action should contain the state')

  redux.uninstall() // uninstall the plugin
  t.end()
})

test('Redux plugin: On state change, dispatch redux action with state', function (t) {
  let firstDispatchedEvent = null
  let secondDispatchedEvent = null
  const actionFunction = (prev, curr, patch) => {
    return {
      type: 'STATE_UPDATED',
      prev,
      curr,
      patch
    }
  }
  const dispatchFunction = (action) => {
    if (firstDispatchedEvent === null) {
      firstDispatchedEvent = action
    } else {
      secondDispatchedEvent = action
    }
  }
  const core = {
    emitter: ee(),
    state: {
      a: 'b',
      c: 'd'
    }
  }

  let redux = new Redux(core, { action: actionFunction, dispatch: dispatchFunction })
  redux.install() // install the plugin

  core.emitter.emit('core:state-update', {
    a: 'b',
    c: 'd'
  }, {
    a: 'b',
    c: 'e'
  }, {
    c: 'e'
  }) // when the uppy state is updated..

  t.deepEqual(secondDispatchedEvent, {
    type: 'STATE_UPDATED',
    prev: {a: 'b', c: 'd'},
    curr: {a: 'b', c: 'e'},
    patch: {c: 'e'}
  }, 'Dispatched action should contain the state')

  redux.uninstall() // uninstall the plugin
  t.end()
})
