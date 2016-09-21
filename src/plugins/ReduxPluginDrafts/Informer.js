/**
 * Informer
 * Shows rad message bubbles
 * used like this: `bus.emit('informer', 'hello world', 'info', 5000)`
 * or for errors: `bus.emit('informer', 'Error uploading img.jpg', 'error', 5000)`
 *
 */

const SHOW_INFORMER = 'SHOW_INFORMER'
const HIDE_INFORMER = 'HIDE_INFORMER'

export default class Informer {
  constructor (opts) {
    // merge default options with the ones set by user
    this.opts = opts

    this.getDefaultState = this.getDefaultState.bind(this)
    this.reducer = this.reducer.bind(this)
  }

  getInitialState () {
    return {
      isHidden: true,
      msg: '',
      duration: 0
    }
  }

  reducer (state = this.getInitialState(), action) {
    switch (action.type) {
      case SHOW_INFORMER:
        return {
          isHidden: false,
          msg: action.payload.msg,
          duration: action.payload.duration
        }
      case HIDE_INFORMER:
        return {
          isHidden: true
        }
      default:
        return state
    }
  }
}

Informer.actions = {
  show (msg, type, duration) {
    return {
      type: 'SHOW_INFORMER',
      payload: {
        msg,
        duration
      }
    }
  },
  hide () {
    return {
      type: 'HIDE_INFORMER'
    }
  }
}
