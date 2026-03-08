import crypto from 'node:crypto'
import { isRecord } from './type-guards.ts'
import { decrypt, encrypt } from './utils.ts'

export type OAuthState = {
  id: string
  origin?: unknown
  preAuthToken?: string
  companionInstance?: string
  customerDefinedAllowedOrigins?: string[]
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
  state: unknown,
  name: T,
  secret: string | Buffer,
): OAuthState[T] | undefined => {
  if (typeof state !== 'string' || state.length === 0) return undefined
  const decoded = decodeState(state, secret)
  return decoded[name]
}

export const getGrantDynamicFromRequest = (req: {
  session?: unknown
}): Record<string, unknown> => {
  const { session } = req
  if (!isRecord(session)) return {}
  const grant = session['grant']
  if (!isRecord(grant)) return {}
  const dynamic = grant['dynamic']
  if (!isRecord(dynamic)) return {}
  return dynamic
}
