/* global jest:false, test:false, expect:false, describe:false, beforeEach:false */

const providerManager = require('../../src/server/provider')
let grantConfig
let uppyOptions

describe('Test Provider options', () => {
  beforeEach(() => {
    grantConfig = require('../../src/config/grant')()
    uppyOptions = require('../../src/standalone/helper').getUppyOptions()
  })

  test('adds provider options', () => {
    providerManager.addProviderOptions(uppyOptions, grantConfig)
    expect(grantConfig.dropbox.key).toBe('dropbox_key')
    expect(grantConfig.dropbox.secret).toBe('dropbox_secret')

    expect(grantConfig.google.key).toBe('google_key')
    expect(grantConfig.google.secret).toBe('google_secret')

    expect(grantConfig.instagram.key).toBe('instagram_key')
    expect(grantConfig.instagram.secret).toBe('instagram_secret')
  })

  test('does not add provider options if protocol and host are not set', () => {
    delete uppyOptions.server.host
    delete uppyOptions.server.protocol

    providerManager.addProviderOptions(uppyOptions, grantConfig)
    expect(grantConfig.dropbox.key).toBeUndefined()
    expect(grantConfig.dropbox.secret).toBeUndefined()

    expect(grantConfig.google.key).toBeUndefined()
    expect(grantConfig.google.secret).toBeUndefined()

    expect(grantConfig.instagram.key).toBeUndefined()
    expect(grantConfig.instagram.secret).toBeUndefined()
  })

  test('sets a master redirect uri, if oauthDomain is set', () => {
    uppyOptions.server.oauthDomain = 'domain.com'
    providerManager.addProviderOptions(uppyOptions, grantConfig)

    expect(grantConfig.dropbox.redirect_uri).toBe('http://domain.com/dropbox/redirect')
    expect(grantConfig.google.redirect_uri).toBe('http://domain.com/drive/redirect')
    expect(grantConfig.instagram.redirect_uri).toBe('http://domain.com/instagram/redirect')
  })
})

describe('Test Custom Provider options', () => {
  test('adds custom provider options', () => {
    const providers = providerManager.getDefaultProviders()
    providerManager.addCustomProviders({
      foo: {
        config: {
          key: 'foo_key',
          secret: 'foo_secret'
        },
        module: jest.mock()
      }
    }, providers, grantConfig)

    expect(grantConfig.foo.key).toBe('foo_key')
    expect(grantConfig.foo.secret).toBe('foo_secret')
    expect(providers.foo).toBeTruthy()
  })
})
