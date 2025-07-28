import { NextResponse, NextRequest } from 'next/server'
import crypto from 'crypto'

function utcDateString(ms: number): string {
  return new Date(ms)
    .toISOString()
    .replace(/-/g, '/')
    .replace(/T/, ' ')
    .replace(/\.\d+Z$/, '+00:00')
}

export async function POST(request: NextRequest) {
  // expire 1 hour from now (this must be milliseconds)
  const expires = utcDateString(Date.now() + 1 * 60 * 60 * 1000)
  const authKey = process.env.TRANSLOADIT_KEY
  const authSecret = process.env.TRANSLOADIT_SECRET
  const templateId = process.env.TRANSLOADIT_TEMPLATE_ID

  // Typically, here you would also deny generating a signature for improper use
  if (!authKey || !authSecret || !templateId) {
    return NextResponse.json(
      { error: 'Missing Transloadit credentials' },
      { status: 500 },
    )
  }

  const body = await request.json()
  const params = JSON.stringify({
    auth: {
      key: authKey,
      expires,
    },
    template_id: templateId,
    fields: {
      // This becomes available in your Template as `${fields.customValue}`
      // and could be used to have a storage directory per user for example
      customValue: body.customValue,
    },
    // your other params like notify_url, etc.
  })

  const signatureBytes = crypto
    .createHmac('sha384', authSecret)
    .update(Buffer.from(params, 'utf-8'))
  // The final signature needs the hash name in front, so
  // the hashing algorithm can be updated in a backwards-compatible
  // way when old algorithms become insecure.
  const signature = `sha384:${signatureBytes.digest('hex')}`

  return NextResponse.json({ expires, signature, params })
}