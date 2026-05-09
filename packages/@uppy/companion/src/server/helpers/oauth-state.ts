import crypto from 'node:crypto'
import type { CompanionSession } from '../../types/express.js'
import { isRecord } from './type-guards.js'
import { decrypt, encrypt } from './utils.js'

export type OAuthState = {
  id: string
  origin?: string | string[] | number | boolean | undefined // weird type because this is what express's res.getHeader and cors callback combined can possibly return
  preAuthToken?: string
  companionInstance?: string
  customerDefinedAllowedOrigins?: string[]
  authCallbackToken?: string
}

export const encodeState = (
  state: OAuthState,
  secret: string | Buffer,
): string => {
  const encodedState = Buffer.from(JSON.stringify(state)).toString('base64')
  return encrypt(encodedState, secret)
}

export const decodeState = (
  state: string,
  secret: string | Buffer,
): OAuthState => {
  const encodedState = decrypt(state, secret)
  const parsed: unknown = JSON.parse(atob(encodedState))
  if (!isOAuthState(parsed)) {
    throw new Error('Invalid OAuth state payload')
  }
  return parsed
}

export const generateState = (): OAuthState => {
  return {
    id: crypto.randomBytes(10).toString('hex'),
  }
}

function isOAuthState(value: unknown): value is OAuthState {
  return isRecord(value) && typeof value['id'] === 'string'
}

export const getFromState = <T extends keyof OAuthState>(
  state: string,
  name: T,
  secret: string | Buffer,
): OAuthState[T] | undefined => {
  return decodeState(state, secret)[name]
}

export const getGrantDynamicFromRequest = (req: {
  session?: CompanionSession
}) => {
  return req.session?.grant?.dynamic ?? {}
}
