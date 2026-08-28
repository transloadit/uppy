import { describe, expect, it } from 'vitest'
import { getSignedSmartCdnUrl, hmacSha256Hex } from './smartCdn.js'

describe('hmacSha256Hex', () => {
  it('matches the well-known HMAC-SHA256 test vector', async () => {
    await expect(
      hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog'),
    ).resolves.toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    )
  })
})

describe('getSignedSmartCdnUrl', () => {
  it('produces the known-answer signed URL', async () => {
    // Expected signature computed with Node:
    //   createHmac('sha256', 'test-secret')
    //     .update('my-workspace/builtin%2Fstorage-serve%400.0.1/photos%2Fsunset%202.jpg?auth_key=test-key&cdn=required&exp=1700000000000')
    //     .digest('hex')
    // which is also what `getSignedSmartCDNUrl` from @transloadit/utils/node and
    // api2's Signature.getSmartCDNUrl sign over.
    await expect(
      getSignedSmartCdnUrl({
        workspace: 'my-workspace',
        template: 'builtin/storage-serve@0.0.1',
        input: 'photos/sunset 2.jpg',
        authKey: 'test-key',
        authSecret: 'test-secret',
        expiresAt: 1_700_000_000_000,
        urlParams: { cdn: 'required' },
      }),
    ).resolves.toBe(
      'https://my-workspace.tlcdn.com/builtin%2Fstorage-serve%400.0.1/photos%2Fsunset%202.jpg?auth_key=test-key&cdn=required&exp=1700000000000&sig=sha256%3A6d694cbe4f3d911bdd2d048e4aaea78a603df196e80148220e5a9e83990744f5',
    )
  })

  it('supports an endpoint override and unsigned URLs', async () => {
    await expect(
      getSignedSmartCdnUrl({
        workspace: 'ws',
        template: 't',
        input: 'a/b.png',
        endpoint: 'https://api2.example/file/ws/',
      }),
    ).resolves.toBe('https://api2.example/file/ws/t/a%2Fb.png')
  })
})
