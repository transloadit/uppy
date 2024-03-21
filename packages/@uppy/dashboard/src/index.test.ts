import { afterAll, beforeAll, describe, it, expect } from 'vitest'

import Core, { UIPlugin } from '@uppy/core'
import StatusBarPlugin from '@uppy/status-bar'
import GoogleDrivePlugin from '@uppy/google-drive'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore untyped
import WebcamPlugin from '@uppy/webcam'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore untyped
import Url from '@uppy/url'

import resizeObserverPolyfill from 'resize-observer-polyfill'
import DashboardPlugin from './index.ts'

type $TSFixMe = any

describe('Dashboard', () => {
  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore we're touching globals for the test
    globalThis.ResizeObserver =
      (resizeObserverPolyfill as any).default || resizeObserverPolyfill
  })
  afterAll(() => {
    // @ts-expect-error we're touching globals for the test
    delete globalThis.ResizeObserver
  })

  it('can safely be added together with the StatusBar without id conflicts', () => {
    const core = new Core()
    core.use(StatusBarPlugin)

    expect(() => {
      core.use(DashboardPlugin, { inline: false })
    }).not.toThrow()

    core.close()
  })

  it('works without any remote provider plugins', () => {
    const core = new Core()

    expect(() => {
      core.use(DashboardPlugin, {
        inline: true,
        target: 'body',
      })
    }).not.toThrow()

    core.close()
  })

  it('works when targeting remote provider plugins using `target`', () => {
    const core = new Core()
    expect(() => {
      core.use(DashboardPlugin, {
        inline: true,
        target: 'body',
      })
      core.use(GoogleDrivePlugin, {
        target: DashboardPlugin as $TSFixMe,
        companionUrl: 'https://fake.uppy.io/',
      })
    }).not.toThrow()

    core.close()
  })

  it('works when passing plugins in `plugins` array', () => {
    const core = new Core()
    core.use(GoogleDrivePlugin, { companionUrl: 'https://fake.uppy.io/' })

    expect(() => {
      core.use(DashboardPlugin, {
        inline: true,
        target: 'body',
        plugins: ['GoogleDrive'],
      })
    }).not.toThrow()

    core.close()
  })

  it('should automatically add plugins which have no target', () => {
    const core = new Core()
    core.use(Url, { companionUrl: 'https://companion.uppy.io' })
    core.use(DashboardPlugin, { inline: false })
    core.use(WebcamPlugin)

    const dashboardPlugins = core.getState().plugins['Dashboard']!
      .targets as UIPlugin<any, any, any>[]

    // two built-in plugins + these ones below
    expect(dashboardPlugins.length).toEqual(4)
    expect(dashboardPlugins.some((plugin) => plugin.id === 'Url')).toEqual(true)
    expect(dashboardPlugins.some((plugin) => plugin.id === 'Webcam')).toEqual(
      true,
    )

    core.close()
  })

  it('should not automatically add plugins which have a non-Dashboard target', () => {
    const core = new Core()
    WebcamPlugin.prototype.start = () => {}
    core.use(Url, { companionUrl: 'https://companion.uppy.io' })
    core.use(DashboardPlugin, { inline: false })
    core.use(WebcamPlugin, { target: 'body' })

    const dashboardPlugins = core.getState().plugins['Dashboard']!
      .targets as UIPlugin<any, any, any>[]

    // two built-in plugins + these ones below
    expect(dashboardPlugins.length).toEqual(3)
    expect(dashboardPlugins.some((plugin) => plugin.id === 'Url')).toEqual(true)
    expect(dashboardPlugins.some((plugin) => plugin.id === 'Webcam')).toEqual(
      false,
    )

    core.close()
  })

  it('should change options on the fly', () => {
    const core = new Core()
    core.use(DashboardPlugin, {
      inline: true,
      target: 'body',
    })

    core.getPlugin('Dashboard')!.setOptions({
      width: 300,
    })

    expect(core.getPlugin('Dashboard')!.opts.width).toEqual(300)
  })

  it('should use updated locale from Core, when it’s set via Core’s setOptions()', () => {
    const core = new Core()
    core.use(DashboardPlugin, {
      inline: true,
      target: 'body',
    })

    core.setOptions({
      locale: {
        strings: {
          myDevice: 'Май дивайс',
        },
      },
    })

    expect(core.getPlugin('Dashboard')!.i18n('myDevice')).toEqual('Май дивайс')
  })

  it('should accept a callback as `metaFields` option', () => {
    const core = new Core()
    expect(() => {
      core.use(DashboardPlugin, {
        metaFields: (file: any) => {
          const fields = [{ id: 'name', name: 'File name' }]
          if (file.type.startsWith('image/')) {
            fields.push({ id: 'location', name: 'Photo Location' })
            fields.push({ id: 'alt', name: 'Alt text' })
          }
          return fields
        },
      })
    }).not.toThrow()

    core.close()
  })
})
