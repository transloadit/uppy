function createCanonicalRequest ({
  method = 'PUT',
  CanonicalUri = '/',
  CanonicalQueryString = '',
  SignedHeaders,
  HashedPayload,
}) {
  const headerKeys = Object.keys(SignedHeaders).map(k => k.toLowerCase()).sort()
  return [
    method,
    CanonicalUri,
    CanonicalQueryString,
    ...headerKeys.map(k => `${k}:${SignedHeaders[k]}`),
    '',
    headerKeys.join(';'),
    HashedPayload,
  ].join('\n')
}

const { subtle } = globalThis.crypto
const ec = new TextEncoder()
const algorithm = { name: 'HMAC', hash: 'SHA-256' }

async function digest (data) {
  return subtle.digest(algorithm.hash, ec.encode(data))
}

async function generateHmacKey (secret) {
  return subtle.importKey('raw', typeof secret === 'string' ? ec.encode(secret) : secret, algorithm, false, ['sign'])
}

function arrayBufferToHexString (arrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer)
  let hexString = ''
  for (let i = 0; i < byteArray.length; i++) {
    hexString += byteArray[i].toString(16).padStart(2, '0')
  }
  return hexString
}

async function hash (key, data) {
  return subtle.sign(algorithm, await generateHmacKey(key), ec.encode(data))
}

export default async function createSignedURL ({
  accountKey, accountSecret, sessionToken,
  bucketName,
  Key, Region,
  uploadId, partNumber,
}) {
  const Service = 's3'
  const host = `${bucketName}.${Service}.${Region}.amazonaws.com`
  const CanonicalUri = `/${encodeURI(Key)}`
  const payload = 'UNSIGNED-PAYLOAD'

  const requestDateTime = new Date().toISOString().replace(/[-:]|\.\d+/g, '')
  const date = requestDateTime.slice(0, 8)
  const scope = `${date}/${Region}/${Service}/aws4_request`

  const url = new URL(`https://${host}${CanonicalUri}`)
  url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
  url.searchParams.set('X-Amz-Content-Sha256', payload)
  url.searchParams.set('X-Amz-Credential', `${accountKey}/${scope}`)
  url.searchParams.set('X-Amz-Date', requestDateTime)
  url.searchParams.set('X-Amz-Expires', '900')
  url.searchParams.set('X-Amz-Security-Token', sessionToken)
  url.searchParams.set('X-Amz-SignedHeaders', 'host')
  url.searchParams.set('X-id', partNumber && uploadId ? 'UploadPart' : 'PutObject')
  if (partNumber) url.searchParams.set('partNumber', partNumber)
  if (uploadId) url.searchParams.set('uploadId', uploadId)

  const canonical = createCanonicalRequest({
    CanonicalUri,
    CanonicalQueryString: url.search.slice(1),
    SignedHeaders: {
      host,
    },
    HashedPayload: payload,
  })
  const hashedCanonical = arrayBufferToHexString(await digest(canonical))

  const stringToSign = [
    `AWS4-HMAC-SHA256`,
    requestDateTime,
    scope,
    hashedCanonical,
  ].join('\n')

  const kDate = await hash(`AWS4${accountSecret}`, date)
  const kRegion = await hash(kDate, Region)
  const kService = await hash(kRegion, Service)
  const kSigning = await hash(kService, 'aws4_request')
  const sign = arrayBufferToHexString(await hash(kSigning, stringToSign))

  url.searchParams.set('X-Amz-Signature', sign)

  return url
}
