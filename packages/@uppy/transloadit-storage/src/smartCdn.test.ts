import { describe, expect, it } from 'vitest'
import { getSignedSmartCdnUrl } from './smartCdn.js'

describe('getSignedSmartCdnUrl', () => {
  it('produces the known-answer signed URL', async () => {
    // Expected signature computed with Node:
    //   createHmac('sha256', 'test-secret')
    //     .update('my-workspace/builtin%2Fstorage-serve%400.0.1/photos%2Fsunset%202.jpg?auth_key=test-key&cdn=required&exp=1700000000000')
    //     .digest('hex')
    // which is also what `getSignedSmartCdnUrl` from @transloadit/utils/node and
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

  it('points the same signed URL at a local api2 with `endpoint`', async () => {
    const url = await getSignedSmartCdnUrl({
      workspace: 'ws',
      template: 't',
      input: 'a/b.png',
      authKey: 'k',
      authSecret: 's',
      expiresAt: 1_700_000_000_000,
      endpoint: 'https://api2.example/file/ws/',
    })
    expect(url).toMatch(
      /^https:\/\/api2\.example\/file\/ws\/t\/a%2Fb\.png\?auth_key=k&exp=1700000000000&sig=sha256%3A[0-9a-f]{64}$/,
    )
  })
})
