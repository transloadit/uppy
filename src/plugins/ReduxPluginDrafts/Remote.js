import { Remote as RemoteBase } from 'uppy-base'

const REMOTE_AUTH = 'REMOTE_AUTH'
const REMOTE_LIST = 'REMOTE_LIST'
const REMOTE_LOGOUT = 'REMOTE_LOGOUT'

class Remote extends RemoteBase {
  constructor (opts) {
    super(opts)
    this.opts = opts
  }

  reducer (state = this.getInitialState(), action) {
    const { payload, type } = action

    // if this isn't the right Remote plugin, just return state
    if (payload.source !== this.id) {
      return state
    }

    switch (type) {
      case REMOTE_AUTH:
        return Object.assign({}, state, {
          authed: payload.authed
        })
      case REMOTE_LIST:
        return Object.assign({}, state, {
          files: payload.files
        })
      case REMOTE_LOGOUT:
        return payload.result.ok ? this.getInitialState() : state
      default:
        return state
    }
  }
}

Remote.actions = {
  auth () {
    return this.auth()
    .then((authed) => {
      return {
        type: REMOTE_AUTH,
        payload: {
          source: this.id,
          authed
        }
      }
    })
  },
  list (directory) {
    return this.list(directory)
    .then((files) => {
      return {
        type: REMOTE_LIST,
        payload: {
          source: this.id,
          files
        }
      }
    })
  },
  logout () {
    return this.logout()
    .then((result) => {
      return {
        type: REMOTE_LOGOUT,
        payload: {
          source: this.id,
          result
        }
      }
    })
  }
}

export default Remote
