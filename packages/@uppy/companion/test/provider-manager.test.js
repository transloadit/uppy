import { beforeEach, describe, expect, test } from 'vitest'
import GrantConfig from '../src/config/grant.js'
import * as providerManager from '../src/server/provider/index.js'
import { getCompanionOptions } from '../src/standalone/helper.js'
import { setDefaultEnv } from './mockserver.js'

let grantConfig
let companionOptions

const getOauthProvider = (providerName) =>
  providerManager.getDefaultProviders()[providerName]?.oauthProvider

describe('Test Provider options', () => {
  beforeEach(() => {
    setDefaultEnv()
    grantConfig = GrantConfig()
    companionOptions = getCompanionOptions()
  })

  test('adds provider options', () => {
    providerManager.addProviderOptions(
      companionOptions,
      grantConfig,
      getOauthProvider,
    )
    expect(grantConfig.dropbox.key).toBe('dropbox_key')
    expect(grantConfig.dropbox.secret).toBe('dropbox_secret')

    expect(grantConfig.box.key).toBe('box_key')
    expect(grantConfig.box.secret).toBe('box_secret')

    expect(grantConfig.googledrive.key).toBe('google_key')
    expect(grantConfig.googledrive.secret).toBe('google_secret')

    expect(grantConfig.googledrive.secret).toBe('google_secret')

    expect(grantConfig.instagram.key).toBe('instagram_key')
    expect(grantConfig.instagram.secret).toBe('instagram_secret')

    expect(grantConfig.zoom.key).toBe('zoom_key')
    expect(grantConfig.zoom.secret).toBe('zoom_secret')
  })

  test('adds extra provider config', () => {
    process.env.COMPANION_INSTAGRAM_KEY = '123456'
    providerManager.addProviderOptions(
      getCompanionOptions(),
      grantConfig,
      getOauthProvider,
    )
    expect(grantConfig.instagram).toEqual({
      transport: 'session',
      state: true,
      callback: '/instagram/callback',
      redirect_uri: 'http://localhost:3020/instagram/redirect',
      key: '123456',
      secret: 'instagram_secret',
      protocol: 'https',
      scope: ['user_profile', 'user_media'],
    })

    expect(grantConfig.dropbox).toEqual({
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

    expect(grantConfig.box).toEqual({
      key: 'box_key',
      secret: 'box_secret',
      transport: 'session',
      state: true,
      redirect_uri: 'http://localhost:3020/box/redirect',
      authorize_url: 'https://account.box.com/api/oauth2/authorize',
      access_url: 'https://api.box.com/oauth2/token',
      callback: '/box/callback',
    })

    expect(grantConfig.googledrive).toEqual({
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

    expect(grantConfig.zoom).toEqual({
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
    process.env.COMPANION_DROPBOX_SECRET_FILE = `${process.env.PWD}/test/resources/dropbox_secret_file`
    process.env.COMPANION_BOX_SECRET_FILE = `${process.env.PWD}/test/resources/box_secret_file`
    process.env.COMPANION_GOOGLE_SECRET_FILE = `${process.env.PWD}/test/resources/google_secret_file`
    process.env.COMPANION_INSTAGRAM_SECRET_FILE = `${process.env.PWD}/test/resources/instagram_secret_file`
    process.env.COMPANION_ZOOM_SECRET_FILE = `${process.env.PWD}/test/resources/zoom_secret_file`
    process.env.COMPANION_ZOOM_VERIFICATION_TOKEN_FILE = `${process.env.PWD}/test/resources/zoom_verification_token_file`

    companionOptions = getCompanionOptions()

    providerManager.addProviderOptions(
      companionOptions,
      grantConfig,
      getOauthProvider,
    )

    expect(grantConfig.dropbox.secret).toBe('xobpord')
    expect(grantConfig.box.secret).toBe('xwbepqd')
    expect(grantConfig.googledrive.secret).toBe('elgoog')
    expect(grantConfig.instagram.secret).toBe('margatsni')
    expect(grantConfig.zoom.secret).toBe('u8Z5ceq')
    expect(companionOptions.providerOptions.zoom.verificationToken).toBe(
      'o0u8Z5c',
    )
  })

  test('does not add provider options if protocol and host are not set', () => {
    delete companionOptions.server.host
    delete companionOptions.server.protocol

    providerManager.addProviderOptions(
      companionOptions,
      grantConfig,
      getOauthProvider,
    )
    expect(grantConfig.dropbox.key).toBeUndefined()
    expect(grantConfig.dropbox.secret).toBeUndefined()

    expect(grantConfig.box.key).toBeUndefined()
    expect(grantConfig.box.secret).toBeUndefined()

    expect(grantConfig.googledrive.key).toBeUndefined()
    expect(grantConfig.googledrive.secret).toBeUndefined()

    expect(grantConfig.instagram.key).toBeUndefined()
    expect(grantConfig.instagram.secret).toBeUndefined()

    expect(grantConfig.zoom.key).toBeUndefined()
    expect(grantConfig.zoom.secret).toBeUndefined()
  })

  test('sets a main redirect uri, if oauthDomain is set', () => {
    companionOptions.server.oauthDomain = 'domain.com'
    providerManager.addProviderOptions(
      companionOptions,
      grantConfig,
      getOauthProvider,
    )

    expect(grantConfig.dropbox.redirect_uri).toBe(
      'http://domain.com/dropbox/redirect',
    )
    expect(grantConfig.box.redirect_uri).toBe('http://domain.com/box/redirect')
    expect(grantConfig.googledrive.redirect_uri).toBe(
      'http://domain.com/drive/redirect',
    )
    expect(grantConfig.instagram.redirect_uri).toBe(
      'http://domain.com/instagram/redirect',
    )
    expect(grantConfig.zoom.redirect_uri).toBe(
      'http://domain.com/zoom/redirect',
    )
  })
})

describe('Test Custom Provider options', () => {
  test('adds custom provider options', () => {
    const providers = providerManager.getDefaultProviders()
    providerManager.addCustomProviders(
      {
        foo: {
          config: {
            key: 'foo_key',
            secret: 'foo_secret',
          },
          // @ts-ignore
          module: { oauthProvider: 'some_provider' },
        },
      },
      providers,
      grantConfig,
    )

    expect(grantConfig.some_provider.key).toBe('foo_key')
    expect(grantConfig.some_provider.secret).toBe('foo_secret')
    expect(providers.foo).toBeTruthy()
  })
})
