import crypto from 'node:crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

function utcDateString(ms: number): string {
  return new Date(ms)
    .toISOString()
    .replace(/-/g, '/')
    .replace(/T/, ' ')
    .replace(/\.\d+Z$/, '+00:00')
}

export async function POST(request: NextRequest) {
  try {
    const expires = utcDateString(Date.now() + 1 * 60 * 60 * 1000) // 1 hour expiry
    const authKey = process.env.TRANSLOADIT_KEY
    const authSecret = process.env.TRANSLOADIT_SECRET
    const templateId = process.env.TRANSLOADIT_TEMPLATE_ID

    if (!authKey || !authSecret) {
      return NextResponse.json(
        {
          error:
            'Missing Transloadit credentials. Please set TRANSLOADIT_KEY and TRANSLOADIT_SECRET environment variables.',
        },
        { status: 500 },
      )
    }

    const body = await request.json().catch(() => ({}))

    // Create a basic template if no template ID is provided
    const params = JSON.stringify({
      auth: {
        key: authKey,
        expires,
      },
      // Use template_id if provided, otherwise use inline steps
      ...(templateId
        ? { template_id: templateId }
        : {
            steps: {
              // Basic image resize step as an example
              resized: {
                use: ':original',
                robot: '/image/resize',
                width: 800,
                height: 600,
                resize_strategy: 'fit',
                imagemagick_stack: 'v3.0.0',
              },
              // Thumbnail generation
              thumbs: {
                use: ':original',
                robot: '/image/resize',
                width: 200,
                height: 200,
                resize_strategy: 'crop',
                imagemagick_stack: 'v3.0.0',
              },
            },
          }),
      fields: {
        // Dynamic fields you can use inside your Template
        customValue: body?.customValue ?? 'nextjs-example',
        timestamp: new Date().toISOString(),
      },
    })

    const signatureBytes = crypto
      .createHmac('sha384', authSecret)
      .update(Buffer.from(params, 'utf-8'))
    const signature = `sha384:${signatureBytes.digest('hex')}`

    return NextResponse.json({
      expires,
      signature,
      params: JSON.parse(params),
    })
  } catch (error) {
    console.error('Error generating Transloadit signature:', error)
    return NextResponse.json(
      { error: 'Failed to generate Transloadit signature' },
      { status: 500 },
    )
  }
}
