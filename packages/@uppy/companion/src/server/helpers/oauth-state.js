const { encrypt, decrypt } = require('./utils')
const crypto = require('crypto')
// @ts-ignore
const atob = require('atob')

module.exports.generateState = (secret) => {
  const state = {}
  state.id = crypto.randomBytes(10).toString('hex')
  return setState(state, secret)
}

module.exports.addToState = (state, data, secret) => {
  const stateObj = getState(state, secret)
  return setState(Object.assign(stateObj, data), secret)
}

module.exports.getFromState = (state, name, secret) => {
  return getState(state, secret)[name]
}

const setState = (state, secret) => {
  const encodedState = Buffer.from(JSON.stringify(state)).toString('base64')
  return encrypt(encodedState, secret)
}

const getState = (state, secret) => {
  const encodedState = decrypt(state, secret)
  return JSON.parse(atob(encodedState))
}
