import crypto from 'node:crypto'
import type { ActionFunctionArgs } from 'react-router'
import { data } from 'react-router'

function utcDateString(ms: number): string {
  return new Date(ms)
    .toISOString()
    .replace(/-/g, '/')
    .replace(/T/, ' ')
    .replace(/\.\d+Z$/, '+00:00')
}

export async function action({ request }: ActionFunctionArgs) {
  // expire 1 hour from now (this must be milliseconds)
  const expires = utcDateString(Date.now() + 1 * 60 * 60 * 1000)
  const authKey = process.env.TRANSLOADIT_KEY
  const authSecret = process.env.TRANSLOADIT_SECRET
  const templateId = process.env.TRANSLOADIT_TEMPLATE_ID

  if (!authKey || !authSecret || !templateId) {
    console.error('Missing Transloadit credentials. Please set:')
    console.error('- TRANSLOADIT_KEY')
    console.error('- TRANSLOADIT_SECRET')
    console.error('- TRANSLOADIT_TEMPLATE_ID')
    console.error('See README.md for setup instructions.')

    throw data(
      {
        error: 'Missing Transloadit credentials',
        details:
          'Please set TRANSLOADIT_KEY, TRANSLOADIT_SECRET, and TRANSLOADIT_TEMPLATE_ID environment variables. See README.md for setup instructions.',
        setupUrl: 'https://transloadit.com/accounts/',
      },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    const params = JSON.stringify({
      auth: {
        key: authKey,
        expires,
      },
      template_id: templateId,
      fields: {
        // You can use this in your template.
        customValue: body.customValue || 'react-router-uppy-example',
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

    return data({ expires, signature, params })
  } catch (error) {
    console.error('Transloadit params error:', error)
    throw data(
      { error: 'Failed to generate Transloadit parameters' },
      { status: 500 },
    )
  }
}
