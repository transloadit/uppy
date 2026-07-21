import { afterEach, describe, expect, it, vi } from 'vitest'
import { showDrivePicker } from './googlePicker.js'

let capturedCallback: ((resp: any) => void) | undefined
let docsViewCalls: Record<string, unknown>

function installGoogleMock() {
  capturedCallback = undefined
  docsViewCalls = {}

  class DocsView {
    setIncludeFolders(v: boolean) {
      docsViewCalls.includeFolders = v
      return this
    }
    setSelectFolderEnabled(v: boolean) {
      docsViewCalls.selectFolderEnabled = v
      return this
    }
    setMode() {
      return this
    }
  }

  class PickerBuilder {
    enableFeature() {
      return this
    }
    setDeveloperKey() {
      return this
    }
    setAppId() {
      return this
    }
    setOAuthToken() {
      return this
    }
    addView() {
      return this
    }
    setCallback(cb: (resp: any) => void) {
      capturedCallback = cb
      return this
    }
    build() {
      return { setVisible() {}, dispose() {} }
    }
  }

  ;(globalThis as any).google = {
    picker: {
      Action: { PICKED: 'picked' },
      Feature: { NAV_HIDDEN: 'nav', MULTISELECT_ENABLED: 'multi' },
      ViewId: { DOCS: 'docs' },
      DocsViewMode: { LIST: 'list' },
      DocsView,
      PickerBuilder,
    },
  }
}

function installFetchMock(folderFiles: unknown[] = []) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.includes('oauth2/v1/tokeninfo')) {
        return { ok: true } as Response
      }
      return {
        ok: true,
        json: async () => ({ files: folderFiles }),
      } as unknown as Response
    }),
  )
}

const baseArgs = {
  token: 'tok',
  apiKey: 'key',
  appId: 'app',
  signal: undefined,
  onLoadingChange: () => {},
  onError: () => {},
}

afterEach(() => {
  vi.restoreAllMocks()
  ;(globalThis as any).google = undefined
})

describe('showDrivePicker selectFolders', () => {
  it('always shows folders (setIncludeFolders true) regardless of selectFolders', async () => {
    installGoogleMock()
    installFetchMock()
    await showDrivePicker({
      ...baseArgs,
      selectFolders: false,
      onFilesPicked: () => {},
      onEmptyFolder: () => {},
    })
    expect(docsViewCalls.includeFolders).toBe(true)
  })

  it('disables folder selection when selectFolders is false', async () => {
    installGoogleMock()
    installFetchMock()
    await showDrivePicker({
      ...baseArgs,
      selectFolders: false,
      onFilesPicked: () => {},
      onEmptyFolder: () => {},
    })
    expect(docsViewCalls.selectFolderEnabled).toBe(false)
  })

  it('enables folder selection when selectFolders is true', async () => {
    installGoogleMock()
    installFetchMock()
    await showDrivePicker({
      ...baseArgs,
      selectFolders: true,
      onFilesPicked: () => {},
      onEmptyFolder: () => {},
    })
    expect(docsViewCalls.includeFolders).toBe(true)
    expect(docsViewCalls.selectFolderEnabled).toBe(true)
  })

  it('calls onEmptyFolder when a picked folder resolves to zero files', async () => {
    installGoogleMock()
    installFetchMock([])
    const onEmptyFolder = vi.fn()
    const onFilesPicked = vi.fn()
    await showDrivePicker({
      ...baseArgs,
      selectFolders: true,
      onFilesPicked,
      onEmptyFolder,
    })
    await capturedCallback!({
      action: 'picked',
      docs: [
        {
          id: 'folder1',
          name: 'My Folder',
          mimeType: 'application/vnd.google-apps.folder',
        },
      ],
    })
    expect(onEmptyFolder).toHaveBeenCalledTimes(1)
    expect(onFilesPicked).toHaveBeenCalledWith([], 'tok')
  })

  it('does NOT call onEmptyFolder when a picked folder has files', async () => {
    installGoogleMock()
    installFetchMock([{ id: 'f1', name: 'a.pdf', mimeType: 'application/pdf' }])
    const onEmptyFolder = vi.fn()
    await showDrivePicker({
      ...baseArgs,
      selectFolders: true,
      onFilesPicked: () => {},
      onEmptyFolder,
    })
    await capturedCallback!({
      action: 'picked',
      docs: [
        {
          id: 'folder1',
          name: 'My Folder',
          mimeType: 'application/vnd.google-apps.folder',
        },
      ],
    })
    expect(onEmptyFolder).not.toHaveBeenCalled()
  })

  it('does NOT call onEmptyFolder when only plain files are picked', async () => {
    installGoogleMock()
    installFetchMock()
    const onEmptyFolder = vi.fn()
    await showDrivePicker({
      ...baseArgs,
      selectFolders: false,
      onFilesPicked: () => {},
      onEmptyFolder,
    })
    await capturedCallback!({
      action: 'picked',
      docs: [{ id: 'f1', name: 'a.pdf', mimeType: 'application/pdf' }],
    })
    expect(onEmptyFolder).not.toHaveBeenCalled()
  })
})
