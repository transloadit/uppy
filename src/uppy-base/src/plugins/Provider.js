'use strict'

const _getName = (id) => {
  return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

export default class Provider {
  constructor (opts) {
    this.opts = opts
    this.provider = opts.provider
    this.id = this.provider
    this.name = this.opts.name || _getName(this.id)
  }

  auth () {
    return fetch(`${this.opts.host}/${this.provider}/authorize`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application.json'
      }
    })
    .then((res) => {
      return res.json()
      .then((payload) => {
        return payload.isAuthenticated
      })
    })
  }

  list (directory) {
    return fetch(`${this.opts.host}/${this.provider}/list/${directory || ''}`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then((res) => res.json())
  }

  logout (redirect = location.href) {
    return fetch(`${this.opts.host}/${this.provider}/logout?redirect=${redirect}`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }
}
