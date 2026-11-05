import { Resolver } from 'node:dns/promises'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  FORBIDDEN_IP_ADDRESS,
  getProtectedGot,
  resolveAddresses,
} from '../dist/server/helpers/request.js'

// nock 14 activates HTTP interception (via @mswjs/interceptors) on import. The
// "blocks ..." tests below rely on the protected agent rejecting the connection
// itself — no response is mocked — and the agent rejects forbidden literal IPs
// synchronously in createConnection with a non-connected socket, which trips
// nock's passthrough ("Cannot use 'in' operator ... '_handle' in undefined").
// So keep interception OFF by default and only enable it for the one test that
// actually mocks a host. nock 14 is active on import, so restore both before
// each test (so the first test can re-activate cleanly) and after each test
// (so interception is never left enabled for subsequent test files).
beforeEach(() => {
  if (nock.isActive()) nock.restore()
})
afterEach(() => {
  vi.restoreAllMocks()
  nock.cleanAll()
  if (nock.isActive()) nock.restore()
})

describe('test protected request Agent', () => {
  test('allows URLs without IP addresses', () => {
    nock.activate()
    nock('https://transloadit.com').get('/').reply(200)
    const url = 'https://transloadit.com'
    return getProtectedGot({ allowLocalIPs: false }).get(url)
  })

  test('blocks url that resolves to forbidden IP', async () => {
    vi.spyOn(Resolver.prototype, 'resolve4').mockResolvedValue(['127.0.0.1'])
    vi.spyOn(Resolver.prototype, 'resolve6').mockResolvedValue([])
    const url = 'https://forbidden.example.com'
    await expect(
      getProtectedGot({ allowLocalIPs: false }).get(url),
    ).rejects.toThrow(/^Forbidden resolved IP address/)
  })

  test('resolves client-chosen names from the DNS servers, not getaddrinfo', async () => {
    const queryError = (code: string) =>
      Object.assign(new Error(code), { code })
    const resolve4 = vi.spyOn(Resolver.prototype, 'resolve4')
    const resolve6 = vi.spyOn(Resolver.prototype, 'resolve6')

    resolve4.mockResolvedValue(['192.0.2.1'])
    resolve6.mockResolvedValue(['2001:db8::1'])
    expect(await resolveAddresses('example.com', 0)).toEqual([
      { address: '192.0.2.1', family: 4 },
      { address: '2001:db8::1', family: 6 },
    ])
    expect(await resolveAddresses('example.com', 6)).toEqual([
      { address: '2001:db8::1', family: 6 },
    ])

    resolve4.mockRejectedValue(queryError('ETIMEOUT'))
    resolve6.mockRejectedValue(queryError('ETIMEOUT'))
    await expect(resolveAddresses('slow.example.com', 0)).rejects.toMatchObject(
      { code: 'ETIMEOUT' },
    )
    resolve4.mockRejectedValue(queryError('ENODATA'))
    resolve6.mockRejectedValue(queryError('ENOTFOUND'))
    await expect(resolveAddresses('none.example.com', 0)).rejects.toMatchObject(
      { code: 'ENOTFOUND' },
    )
  })

  test('does not wait long for an address family that never answers', async () => {
    vi.spyOn(Resolver.prototype, 'resolve4').mockResolvedValue(['192.0.2.1'])
    vi.spyOn(Resolver.prototype, 'resolve6').mockReturnValue(
      new Promise(() => {}),
    )
    const started = Date.now()
    expect(await resolveAddresses('example.com', 0)).toEqual([
      { address: '192.0.2.1', family: 4 },
    ])
    expect(Date.now() - started).toBeLessThan(1000)
  })

  test('gives up on a name whose DNS servers never answer', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      vi.spyOn(Resolver.prototype, 'resolve4').mockReturnValue(
        new Promise(() => {}),
      )
      vi.spyOn(Resolver.prototype, 'resolve6').mockReturnValue(
        new Promise(() => {}),
      )
      const result = resolveAddresses('silent.example.com', 0)
      const assertion = expect(result).rejects.toMatchObject({
        code: 'ETIMEOUT',
      })
      await vi.advanceTimersByTimeAsync(5000)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })

  test('blocks private http IP address', async () => {
    const url = 'http://172.20.10.4:8090'
    await expect(
      getProtectedGot({ allowLocalIPs: false }).get(url),
    ).rejects.toThrow(FORBIDDEN_IP_ADDRESS)
  })

  test('blocks private https IP address', async () => {
    const url = 'https://172.20.10.4:8090'
    await expect(
      getProtectedGot({ allowLocalIPs: false }).get(url),
    ).rejects.toThrow(FORBIDDEN_IP_ADDRESS)
  })

  test('blocks various private IP addresses', async () => {
    // taken from: https://github.com/transloadit/uppy/blob/4aeef4dac0490ebb1d1fccd5582ba42c6c0fb87d/packages/%40uppy/companion/src/server/helpers/request.js#L14
    const ipv4s = [
      '0.0.0.0',
      '0.0.0.1',
      '127.0.0.1',
      '127.16.0.1',
      '192.168.1.1',
      '169.254.1.1',
      '10.0.0.1',
    ]

    const ipv6s = [
      'fd80::1234:5678:abcd:0123',
      'fe80::1234:5678:abcd:0123',
      'ff00::1234',
      '::ffff:192.168.1.10',
      '::1',
      '0:0:0:0:0:0:0:1',
      'fda1:3f9f:dbf7::1c8d',
    ]

    for (const ip of ipv4s) {
      const url = `http://${ip}:8090`
      await expect(
        getProtectedGot({ allowLocalIPs: false }).get(url),
      ).rejects.toThrow(FORBIDDEN_IP_ADDRESS)
    }
    for (const ip of ipv6s) {
      const url = `http://[${ip}]:8090`
      await expect(
        getProtectedGot({ allowLocalIPs: false }).get(url),
      ).rejects.toThrow(FORBIDDEN_IP_ADDRESS)
    }
  })
})
