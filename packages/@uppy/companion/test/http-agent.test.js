import nock from 'nock'
import { afterAll, describe, expect, test } from 'vitest'
import {
  FORBIDDEN_IP_ADDRESS,
  getProtectedGot,
} from '../src/server/helpers/request.js'

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

describe('test protected request Agent', () => {
  test('allows URLs without IP addresses', async () => {
    nock('https://transloadit.com').get('/').reply(200)
    const url = 'https://transloadit.com'
    return getProtectedGot({ allowLocalIPs: false }).get(url)
  })

  test('blocks url that resolves to forbidden IP', async () => {
    const url = 'https://localhost'
    await expect(
      getProtectedGot({ allowLocalIPs: false }).get(url),
    ).rejects.toThrow(/^Forbidden resolved IP address/)
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
