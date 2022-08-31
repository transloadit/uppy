import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import resizeObserverPolyfill from 'resize-observer-polyfill'
import Core from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import RemoteSources from './index.js'

describe('RemoteSources', () => {
  beforeAll(() => {
    globalThis.ResizeObserver = resizeObserverPolyfill.default || resizeObserverPolyfill
  })

  afterAll(() => {
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
      core.use(RemoteSources, { sources: ['Webcam'] })
    }).toThrow(new Error('Please specify companionUrl for RemoteSources to work, see https://uppy.io/docs/remote-sources#companionUrl'))
  })

  it('should throw when trying to use a plugin which is not included in RemoteSources', () => {
    expect(() => {
      const core = new Core()
      core.use(Dashboard)
      core.use(RemoteSources, {
        companionUrl: 'https://example.com',
        sources: ['Webcam'],
      })
    }).toThrow('Invalid plugin: "Webcam" is not one of: Box, Dropbox, Facebook, GoogleDrive, Instagram, OneDrive, Unsplash, Url, or Zoom.')
  })
})
