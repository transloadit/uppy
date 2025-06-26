const enc = new TextEncoder('utf-8')
async function sign(secret, body) {
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
function getExpiration(future) {
  return new Date(Date.now() + future)
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z$/, '+00:00')
}
/**
 * Adds an expiration date and signs the params object if a secret is passed to
 * it. If no secret is given, it returns the same object.
 *
 * @param {string | undefined} secret
 * @param {object} params
 * @returns {Promise<{ params: string, signature?: string }>}
 */
export default async function generateSignatureIfSecret(secret, params) {
  let signature
  if (secret) {
    params.auth.expires = getExpiration(5 * 60 * 1000)
    params = JSON.stringify(params)
    signature = await sign(secret, params)
  }

  return { params, signature }
}
