import Core from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import resizeObserverPolyfill from 'resize-observer-polyfill'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import RemoteSources from './index.js'

describe('RemoteSources', () => {
  beforeAll(() => {
    globalThis.ResizeObserver =
      resizeObserverPolyfill.default || resizeObserverPolyfill
  })

  afterAll(() => {
    // @ts-expect-error delete does not have to be conditional
    delete globalThis.ResizeObserver
  })

  it('should install RemoteSources with default options', () => {
    expect(() => {
      const core = new Core()
      core.use(Dashboard)
      core.use(RemoteSources, { companionUrl: 'https://example.com' })
    }).not.toThrow()
  })

  it('should throw when a companionUrl is not specified', () => {
    expect(() => {
      const core = new Core()
      core.use(Dashboard)
      // @ts-expect-error companionUrl is missing
      core.use(RemoteSources, { sources: ['Webcam'] })
    }).toThrow(
      new Error(
        'Please specify companionUrl for RemoteSources to work, see https://uppy.io/docs/remote-sources#companionUrl',
      ),
    )
  })

  it('should throw when trying to use a plugin which is not included in RemoteSources', () => {
    expect(() => {
      const core = new Core()
      core.use(Dashboard)
      core.use(RemoteSources, {
        companionUrl: 'https://example.com',
        // @ts-expect-error test invalid
        sources: ['Webcam'],
      })
    }).toThrow(
      'Invalid plugin: "Webcam" is not one of: Box, Dropbox, Facebook, GoogleDrive, Instagram, OneDrive, Unsplash, Url, or Zoom.',
    )
  })

  it('should pass companionKeysParams', () => {
    const core = new Core()
    const companionKeysParams = {
      GoogleDrive: { key: 'google', credentialsName: 'google' },
    }
    core.use(Dashboard)
    core.use(RemoteSources, {
      companionUrl: 'https://example.com',
      companionKeysParams,
    })
    expect(core.getPlugin('GoogleDrive')?.opts.companionKeysParams).toEqual(
      companionKeysParams.GoogleDrive,
    )
  })
})
