import { network } from 'virtual:msw'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RequestClient from '../../lib/companion-client/RequestClient.js'
import Uppy from '../../lib/index.js'

network.configure({ context: { quiet: true } })
await network.enable()

afterEach(() => network.resetHandlers())

describe('RequestClient', () => {
  it('has a hostname without trailing slash', () => {
    const mockCore = { getState: () => ({}) } as any
    const a = new RequestClient(mockCore, {
      companionUrl: 'http://companion.uppy.io',
    })
    const b = new RequestClient(mockCore, {
      companionUrl: 'http://companion.uppy.io/',
    })

    expect(a.hostname).toBe('http://companion.uppy.io')
    expect(b.hostname).toBe('http://companion.uppy.io')
  })

  it('skips host discovery as well as response hooks with skipPostResponse', async () => {
    using uppy = new Uppy()
    const client = new RequestClient(uppy, {
      companionUrl: 'http://companion.test',
    })
    using responseHook = vi.spyOn(client, 'onReceiveResponse')
    network.use(
      http.get('http://companion.test/test', () =>
        HttpResponse.json(
          {},
          { headers: { 'i-am': 'http://discovered.test' } },
        ),
      ),
    )
    await client.get('test', { skipPostResponse: true })
    expect(responseHook).not.toHaveBeenCalled()
    expect(client.hostname).toBe('http://companion.test')
  })
})

describe('Companion self-identification', () => {
  it.each([
    'javascript:alert(document.domain)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    '//relative.example',
    'not a URL',
    'https://user:password@instance.test',
  ])('ignores unsafe i-am value %s and retains the last valid instance', (value) => {
    using uppy = new Uppy()
    const client = new RequestClient(uppy, {
      companionUrl: 'https://companion.test',
    })
    client.onReceiveResponse(
      new Response(null, {
        headers: { 'i-am': 'https://instance.test/companion' },
      }),
    )
    client.onReceiveResponse(new Response(null, { headers: { 'i-am': value } }))
    expect(client.hostname).toBe('https://instance.test/companion')
  })

  it('keeps sticky HTTP(S) instances and path prefixes', () => {
    using uppy = new Uppy()
    const client = new RequestClient(uppy, {
      companionUrl: 'https://companion.test',
    })
    client.onReceiveResponse(
      new Response(null, {
        headers: { 'i-am': 'http://instance.test:3020/companion/' },
      }),
    )
    expect(client.hostname).toBe('http://instance.test:3020/companion')
    client.onReceiveResponse(new Response(null))
    expect(client.hostname).toBe('http://instance.test:3020/companion')
  })
})
