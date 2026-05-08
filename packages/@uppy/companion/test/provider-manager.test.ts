import { beforeEach, describe, expect, test } from 'vitest'
import createGrantConfig from '../src/config/grant.js'
import * as providerManager from '../src/server/provider/index.js'
import Provider, { type ProviderCtor } from '../src/server/provider/Provider.js'
import { getCompanionOptions } from '../src/standalone/helper.js'
import { setDefaultEnv } from './mockserver.js'

type GrantConfigType = providerManager.GrantConfig

let grantConfig: GrantConfigType
let companionOptions: ReturnType<typeof getCompanionOptions>

const getOauthProvider = (providerName: string) =>
  providerManager.getDefaultProviders()[
    providerName as keyof ReturnType<
      (typeof providerManager)['getDefaultProviders']
    >
  ]?.oauthProvider

function getAddProviderOptionsArgs(
  options: ReturnType<typeof getCompanionOptions>,
): Parameters<typeof providerManager.addProviderOptions>[0] {
  const { server, providerOptions } = options
  return {
    ...(server === undefined ? {} : { server }),
    ...(providerOptions === undefined ? {} : { providerOptions }),
  }
}

function requireGrantProviderConfig(
  config: GrantConfigType,
  providerName: string,
) {
  const providerConfig = config[providerName]
  if (!providerConfig) {
    throw new Error(`Expected grantConfig['${providerName}'] to be an object`)
  }
  return providerConfig
}

function getGrantProviderField(
  config: GrantConfigType,
  providerName: string,
  fieldName: keyof providerManager.GrantProviderConfig,
): unknown {
  const providerConfig = config[providerName]
  return providerConfig?.[fieldName]
}

describe('Test Provider options', () => {
  beforeEach(() => {
    setDefaultEnv()
    grantConfig = createGrantConfig()
    companionOptions = getCompanionOptions()
  })

  test('adds provider options', () => {
    providerManager.addProviderOptions(
      getAddProviderOptionsArgs(companionOptions),
      grantConfig,
      getOauthProvider,
    )
    const dropbox = requireGrantProviderConfig(grantConfig, 'dropbox')
    expect(dropbox['key']).toBe('dropbox_key')
    expect(dropbox['secret']).toBe('dropbox_secret')

    const box = requireGrantProviderConfig(grantConfig, 'box')
    expect(box['key']).toBe('box_key')
    expect(box['secret']).toBe('box_secret')

    const googledrive = requireGrantProviderConfig(grantConfig, 'googledrive')
    expect(googledrive['key']).toBe('google_key')
    expect(googledrive['secret']).toBe('google_secret')

    expect(googledrive['secret']).toBe('google_secret')

    const zoom = requireGrantProviderConfig(grantConfig, 'zoom')
    expect(zoom['key']).toBe('zoom_key')
    expect(zoom['secret']).toBe('zoom_secret')
  })

  test('adds extra provider config', () => {
    providerManager.addProviderOptions(
      getAddProviderOptionsArgs(getCompanionOptions()),
      grantConfig,
      getOauthProvider,
    )

    expect(requireGrantProviderConfig(grantConfig, 'dropbox')).toEqual({
      key: 'dropbox_key',
      secret: 'dropbox_secret',
      transport: 'session',
      state: true,
      redirect_uri: 'http://localhost:3020/dropbox/redirect',
      authorize_url: 'https://www.dropbox.com/oauth2/authorize',
      access_url: 'https://api.dropbox.com/oauth2/token',
      callback: '/dropbox/callback',
      custom_params: {
        token_access_type: 'offline',
      },
    })

    expect(requireGrantProviderConfig(grantConfig, 'box')).toEqual({
      key: 'box_key',
      secret: 'box_secret',
      transport: 'session',
      state: true,
      redirect_uri: 'http://localhost:3020/box/redirect',
      authorize_url: 'https://account.box.com/api/oauth2/authorize',
      access_url: 'https://api.box.com/oauth2/token',
      callback: '/box/callback',
    })

    expect(requireGrantProviderConfig(grantConfig, 'googledrive')).toEqual({
      access_url: 'https://oauth2.googleapis.com/token',
      authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth',
      oauth: 2,
      scope_delimiter: ' ',

      key: 'google_key',
      secret: 'google_secret',
      transport: 'session',
      state: true,
      redirect_uri: 'http://localhost:3020/drive/redirect',
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
      callback: '/drive/callback',
      custom_params: {
        access_type: 'offline',
        prompt: 'consent',
      },
    })

    expect(requireGrantProviderConfig(grantConfig, 'zoom')).toEqual({
      key: 'zoom_key',
      secret: 'zoom_secret',
      transport: 'session',
      state: true,
      authorize_url: 'https://zoom.us/oauth/authorize',
      redirect_uri: 'http://localhost:3020/zoom/redirect',
      access_url: 'https://zoom.us/oauth/token',
      callback: '/zoom/callback',
    })
  })

  test('adds provider options for secret files', () => {
    process.env['COMPANION_DROPBOX_SECRET_FILE'] =
      `${process.env['PWD']}/test/resources/dropbox_secret_file`
    process.env['COMPANION_BOX_SECRET_FILE'] =
      `${process.env['PWD']}/test/resources/box_secret_file`
    process.env['COMPANION_GOOGLE_SECRET_FILE'] =
      `${process.env['PWD']}/test/resources/google_secret_file`
    process.env['COMPANION_ZOOM_SECRET_FILE'] =
      `${process.env['PWD']}/test/resources/zoom_secret_file`
    process.env['COMPANION_ZOOM_VERIFICATION_TOKEN_FILE'] =
      `${process.env['PWD']}/test/resources/zoom_verification_token_file`

    companionOptions = getCompanionOptions()

    providerManager.addProviderOptions(
      getAddProviderOptionsArgs(companionOptions),
      grantConfig,
      getOauthProvider,
    )

    expect(requireGrantProviderConfig(grantConfig, 'dropbox')['secret']).toBe(
      'xobpord',
    )
    expect(requireGrantProviderConfig(grantConfig, 'box')['secret']).toBe(
      'xwbepqd',
    )
    expect(
      requireGrantProviderConfig(grantConfig, 'googledrive')['secret'],
    ).toBe('elgoog')
    expect(requireGrantProviderConfig(grantConfig, 'zoom')['secret']).toBe(
      'u8Z5ceq',
    )

    const providerOptions = companionOptions.providerOptions
    const zoomProviderOptions = providerOptions?.['zoom']
    if (zoomProviderOptions == null) {
      throw new Error(
        'Expected companionOptions.providerOptions["zoom"] to exist',
      )
    }
    expect(zoomProviderOptions['verificationToken']).toBe('o0u8Z5c')
  })

  test('does not add provider options if protocol and host are not set', () => {
    const server = companionOptions.server

    // @ts-expect-error we are intentionally deleting these fields to test the behavior when they are missing
    delete server['host']
    delete server['protocol']

    providerManager.addProviderOptions(
      getAddProviderOptionsArgs(companionOptions),
      grantConfig,
      getOauthProvider,
    )
    expect(getGrantProviderField(grantConfig, 'dropbox', 'key')).toBeUndefined()
    expect(
      getGrantProviderField(grantConfig, 'dropbox', 'secret'),
    ).toBeUndefined()

    expect(getGrantProviderField(grantConfig, 'box', 'key')).toBeUndefined()
    expect(getGrantProviderField(grantConfig, 'box', 'secret')).toBeUndefined()

    expect(
      getGrantProviderField(grantConfig, 'googledrive', 'key'),
    ).toBeUndefined()
    expect(
      getGrantProviderField(grantConfig, 'googledrive', 'secret'),
    ).toBeUndefined()

    expect(getGrantProviderField(grantConfig, 'zoom', 'key')).toBeUndefined()
    expect(getGrantProviderField(grantConfig, 'zoom', 'secret')).toBeUndefined()
  })

  test('sets a main redirect uri, if oauthDomain is set', () => {
    const server = companionOptions.server
    if (server == null) throw new Error('Expected companionOptions.server')
    server['oauthDomain'] = 'domain.com'
    providerManager.addProviderOptions(
      getAddProviderOptionsArgs(companionOptions),
      grantConfig,
      getOauthProvider,
    )

    expect(
      requireGrantProviderConfig(grantConfig, 'dropbox')['redirect_uri'],
    ).toBe('http://domain.com/dropbox/redirect')
    expect(requireGrantProviderConfig(grantConfig, 'box')['redirect_uri']).toBe(
      'http://domain.com/box/redirect',
    )
    expect(
      requireGrantProviderConfig(grantConfig, 'googledrive')['redirect_uri'],
    ).toBe('http://domain.com/drive/redirect')
    expect(
      requireGrantProviderConfig(grantConfig, 'zoom')['redirect_uri'],
    ).toBe('http://domain.com/zoom/redirect')
  })
})

describe('Test Custom Provider options', () => {
  test('adds custom provider options', () => {
    const providers = providerManager.getDefaultProviders()

    class SomeProvider extends Provider {
      static override get oauthProvider(): string {
        return 'some_provider'
      }
    }

    providerManager.addCustomProviders(
      {
        foo: {
          config: {
            key: 'foo_key',
            secret: 'foo_secret',
          },
          module: SomeProvider,
        },
      },
      providers as Record<string, ProviderCtor>,
      grantConfig,
    )

    const someProvider = requireGrantProviderConfig(
      grantConfig,
      'some_provider',
    )
    expect(someProvider['key']).toBe('foo_key')
    expect(someProvider['secret']).toBe('foo_secret')
    expect(providers['foo' as keyof typeof providers]).toBeTruthy()
  })
})
