import crypto from 'node:crypto'
import { decrypt, encrypt } from './utils.js'

export const encodeState = (state, secret) => {
  const encodedState = Buffer.from(JSON.stringify(state)).toString('base64')
  return encrypt(encodedState, secret)
}

export const decodeState = (state, secret) => {
  const encodedState = decrypt(state, secret)
  return JSON.parse(atob(encodedState))
}

export const generateState = () => {
  return {
    id: crypto.randomBytes(10).toString('hex'),
  }
}

export const getFromState = (state, name, secret) => {
  return decodeState(state, secret)[name]
}

export const getGrantDynamicFromRequest = (req) => {
  return req.session.grant?.dynamic ?? {}
}
