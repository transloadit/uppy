import { describe, expect, test } from 'vitest'
import { getMaskableSecrets } from '../src/config/companion.js'

describe('getMaskableSecrets', () => {
  test('collects every secret the options can hold, blanks dropped', () => {
    const options = {
      s3: { key: 'k', secret: 'upload-secret' },
      providerOptions: {
        drive: { key: 'k', secret: 'drive-secret' },
        dropbox: { key: 'k', secret: '' },
        s3: { grantSecret: ['next', ' ', 'previous'], grantPublicKey: 'pem' },
        'transloadit-storage': {
          grantSecret: 'ts-grant',
          apiEndpoint: 'https://api.example',
          workspaces: {
            a: { key: 'k', secret: 'ws-a' },
            b: { key: 'k', secret: 'ws-b' },
          },
        },
      },
      customProviders: {
        mine: { config: { key: 'k', secret: 'custom-secret' } },
      },
    }
    expect(getMaskableSecrets(options as never).sort()).toEqual(
      [
        'upload-secret',
        'drive-secret',
        'next',
        'previous',
        'ts-grant',
        'ws-a',
        'ws-b',
        'custom-secret',
      ].sort(),
    )
  })

  test('survives class instances, cycles and non-string entries', () => {
    const cyclic: Record<string, unknown> = { secret: 'c' }
    cyclic['self'] = cyclic
    const options = {
      s3: { awsClientOptions: { requestHandler: new Map(), secret: 'inner' } },
      providerOptions: { s3: { grantSecret: [1, 'real'] } },
      customProviders: { p: { config: cyclic } },
    }
    expect(getMaskableSecrets(options as never).sort()).toEqual(
      ['c', 'inner', 'real'].sort(),
    )
  })
})
