const crypto = require('node:crypto')
const { encrypt, decrypt } = require('./utils')

module.exports.encodeState = (state, secret) => {
  const encodedState = Buffer.from(JSON.stringify(state)).toString('base64')
  return encrypt(encodedState, secret)
}

module.exports.decodeState = (state, secret) => {
  const encodedState = decrypt(state, secret)
  return JSON.parse(atob(encodedState))
}

module.exports.generateState = () => {
  return {
    id: crypto.randomBytes(10).toString('hex'),
  }
}

module.exports.getFromState = (state, name, secret) => {
  return module.exports.decodeState(state, secret)[name]
}

module.exports.getGrantDynamicFromRequest = (req) => {
  return req.session.grant?.dynamic ?? {}
}
