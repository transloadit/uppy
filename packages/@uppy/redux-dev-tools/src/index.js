const { UIPlugin } = require('@uppy/core')

/* eslint-disable max-len */
/**
 * Add Redux DevTools support to Uppy
 *
 * See https://medium.com/@zalmoxis/redux-devtools-without-redux-or-how-to-have-a-predictable-state-with-any-architecture-61c5f5a7716f
 * and https://github.com/zalmoxisus/mobx-remotedev/blob/master/src/monitorActions.js
 */
/* eslint-enable max-len */
module.exports = class ReduxDevTools extends UIPlugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'debugger'
    this.id = this.opts.id || 'ReduxDevTools'
    this.title = 'Redux DevTools'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }

    this.handleStateChange = this.handleStateChange.bind(this)
    this.initDevTools = this.initDevTools.bind(this)
  }

  handleStateChange (prevState, nextState) {
    this.devTools.send('UPPY_STATE_UPDATE', nextState)
  }

  initDevTools () {
    this.devTools = window.devToolsExtension.connect()
    this.devToolsUnsubscribe = this.devTools.subscribe((message) => {
      if (message.type === 'DISPATCH') {
        // Implement monitors actions
        switch (message.payload.type) {
          case 'RESET':
            this.uppy.reset()
            return
          case 'IMPORT_STATE': {
            const { computedStates } = message.payload.nextLiftedState
            this.uppy.store.state = { ...this.uppy.getState(), ...computedStates[computedStates.length - 1].state }
            this.uppy.updateAll(this.uppy.getState())
            return
          }
          case 'JUMP_TO_STATE':
          case 'JUMP_TO_ACTION':
            this.uppy.store.state = { ...this.uppy.getState(), ...JSON.parse(message.state) }
            this.uppy.updateAll(this.uppy.getState())
        }
      }
    })
  }

  install () {
    // eslint-disable-next-line no-underscore-dangle
    this.withDevTools = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__
    if (this.withDevTools) {
      this.initDevTools()
      this.uppy.on('state-update', this.handleStateChange)
    }
  }

  uninstall () {
    if (this.withDevTools) {
      this.devToolsUnsubscribe()
      this.uppy.off('state-update', this.handleStateUpdate)
    }
  }
}
