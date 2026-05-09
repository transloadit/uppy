import Core, { type UIPlugin } from '@uppy/core'
import GoogleDrivePlugin from '@uppy/google-drive'
// @ts-ignore untyped
import Url from '@uppy/url'
// @ts-ignore untyped
import WebcamPlugin from '@uppy/webcam'
import resizeObserverPolyfill from 'resize-observer-polyfill'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import DashboardPlugin from './index.js'

type $TSFixMe = any

describe('Dashboard', () => {
  beforeAll(() => {
    // @ts-ignore we're touching globals for the test
    globalThis.ResizeObserver =
      (resizeObserverPolyfill as any).default || resizeObserverPolyfill
  })
  afterAll(() => {
    // @ts-expect-error we're touching globals for the test
    delete globalThis.ResizeObserver
  })

  it('works without any remote provider plugins', () => {
    const core = new Core()

    expect(() => {
      core.use(DashboardPlugin, {
        inline: true,
        target: 'body',
      })
    }).not.toThrow()

    core.destroy()
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

    core.destroy()
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

    core.destroy()
  })

  it('should automatically add plugins which have no target', () => {
    const core = new Core()
    core.use(Url, { companionUrl: 'https://companion.uppy.io' })
    core.use(DashboardPlugin, { inline: false })
    core.use(WebcamPlugin)

    const dashboardPlugins = core.getState().plugins.Dashboard!
      .targets as UIPlugin<any, any, any>[]

    // two built-in plugins + these ones below
    expect(dashboardPlugins.length).toEqual(2)
    expect(dashboardPlugins.some((plugin) => plugin.id === 'Url')).toEqual(true)
    expect(dashboardPlugins.some((plugin) => plugin.id === 'Webcam')).toEqual(
      true,
    )

    core.destroy()
  })

  it('should not automatically add plugins which have a non-Dashboard target', () => {
    const core = new Core()
    WebcamPlugin.prototype.start = () => undefined
    core.use(Url, { companionUrl: 'https://companion.uppy.io' })
    core.use(DashboardPlugin, { inline: false })
    core.use(WebcamPlugin, { target: 'body' })

    const dashboardPlugins = core.getState().plugins.Dashboard!
      .targets as UIPlugin<any, any, any>[]

    // two built-in plugins + these ones below
    expect(dashboardPlugins.length).toEqual(1)
    expect(dashboardPlugins.some((plugin) => plugin.id === 'Url')).toEqual(true)
    expect(dashboardPlugins.some((plugin) => plugin.id === 'Webcam')).toEqual(
      false,
    )

    core.destroy()
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

    core.destroy()
  })

  describe('My Device acquirer respects fileManagerSelectionType', () => {
    // `showNativePhotoCameraButton: true` is used to force the My Device tab
    // to render — Dashboard hides it when it would be the only entry in the list
    // (see `hasOnlyMyDevice` in AddFiles.tsx).
    const mountDashboard = (
      fileManagerSelectionType: 'files' | 'folders' | 'both',
    ) => {
      document.body.innerHTML = ''
      const core = new Core()
      core.use(DashboardPlugin, {
        inline: true,
        target: 'body',
        fileManagerSelectionType,
        showNativePhotoCameraButton: true,
      })
      return core
    }

    const getInputs = () => {
      const fileInput = document.querySelector<HTMLInputElement>(
        '.uppy-Dashboard-input:not([webkitdirectory])',
      )!
      const folderInput = document.querySelector<HTMLInputElement>(
        '.uppy-Dashboard-input[webkitdirectory]',
      )!
      return { fileInput, folderInput }
    }

    const clickMyDeviceTab = () => {
      const tab = document.querySelector<HTMLButtonElement>(
        '[data-uppy-acquirer-id="MyDevice"] button[role="tab"]',
      )!
      tab.click()
    }

    it('triggers the folder input when set to "folders"', () => {
      const core = mountDashboard('folders')
      const { fileInput, folderInput } = getInputs()

      let fileClicked = false
      let folderClicked = false
      fileInput.addEventListener('click', () => {
        fileClicked = true
      })
      folderInput.addEventListener('click', () => {
        folderClicked = true
      })

      clickMyDeviceTab()

      expect(folderClicked).toBe(true)
      expect(fileClicked).toBe(false)

      core.destroy()
    })

    it('triggers the file input when set to "files"', () => {
      const core = mountDashboard('files')
      const { fileInput, folderInput } = getInputs()

      let fileClicked = false
      let folderClicked = false
      fileInput.addEventListener('click', () => {
        fileClicked = true
      })
      folderInput.addEventListener('click', () => {
        folderClicked = true
      })

      clickMyDeviceTab()

      expect(fileClicked).toBe(true)
      expect(folderClicked).toBe(false)

      core.destroy()
    })

    // `both` mode intentionally falls back to the file picker because a single
    // HTML <input> cannot be webkitdirectory and not at the same time. The
    // folder picker remains reachable via the tagline "browse folders" link.
    it('falls back to the file input when set to "both"', () => {
      const core = mountDashboard('both')
      const { fileInput, folderInput } = getInputs()

      let fileClicked = false
      let folderClicked = false
      fileInput.addEventListener('click', () => {
        fileClicked = true
      })
      folderInput.addEventListener('click', () => {
        folderClicked = true
      })

      clickMyDeviceTab()

      expect(fileClicked).toBe(true)
      expect(folderClicked).toBe(false)

      core.destroy()
    })
  })
})
