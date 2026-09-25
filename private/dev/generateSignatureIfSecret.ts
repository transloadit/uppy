import type { AssemblyParameters } from '@uppy/transloadit'

const enc = new TextEncoder()
async function sign(secret: string, body: string) {
  const algorithm = { name: 'HMAC', hash: 'SHA-384' }

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    algorithm,
    false,
    ['sign', 'verify'],
  )
  const signature = await crypto.subtle.sign(
    algorithm.name,
    key,
    enc.encode(body),
  )
  return `sha384:${Array.from(new Uint8Array(signature), (x) => x.toString(16).padStart(2, '0')).join('')}`
}
function getExpiration(future: number) {
  return new Date(Date.now() + future)
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z$/, '+00:00')
}
/**
 * Adds an expiration date and signs the params object if a secret is passed to
 * it. If no secret is given, it returns the same object.
 */
export default async function generateSignatureIfSecret(
  secret: string | undefined,
  params: AssemblyParameters,
) {
  if (!secret) return { params, fields: {} }

  if (params.auth) params.auth.expires = getExpiration(5 * 60 * 1000)
  const paramsString = JSON.stringify(params)
  return {
    params: paramsString,
    signature: await sign(secret, paramsString),
    fields: {},
  }
}
