import {
  type CompanionPluginOptions,
  RequestClient,
  tokenStorage,
} from '@uppy/companion-client'
import type Uppy from '@uppy/core'
import {
  authorize,
  logout as doLogout,
  ensureScriptsInjected,
  InvalidTokenError,
  mapPickerFile,
  type PickedItem,
  type PickingSession,
  pollPickingSession,
  showDrivePicker,
  showPhotosPicker,
} from '@uppy/provider-views'

export type GooglePickerType = 'drive' | 'photos'

/**
 * A simple react-like immutable store that can be used with useSyncExternalStore and the like
 */
function createStore<T>(initialState: T) {
  let state = initialState
  const listeners = new Set<(state: T) => void>()

  function getSnapshot() {
    return state
  }

  function setState(updater: (prevState: T) => T) {
    state = typeof updater === 'function' ? updater(state) : updater

    listeners.forEach((listener) => listener(state))
  }

  function subscribe(listener: (state: T) => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return {
    getSnapshot,
    setState,
    subscribe,
  }
}

export interface GooglePickerOptions extends CompanionPluginOptions {
  pickerType: GooglePickerType
  clientId: string
  requestClientId?: string
  apiKey?: string
  appId?: string
}

export function createGooglePickerController({
  uppy,
  storage: persistentStore = tokenStorage,
  pickerType,
  companionUrl,
  companionHeaders,
  companionCookiesRule,
  requestClientId = pickerType === 'drive'
    ? 'GoogleDrivePicker'
    : 'GooglePhotosPicker',
  clientId,
  apiKey,
  appId,
}: {
  uppy: Uppy
} & GooglePickerOptions) {
  const storageKey = `uppy:google-${pickerType}-picker:accessToken`

  const store = createStore({
    loading: false,
    accessToken: undefined as string | null | undefined,
  })

  let abortController = new AbortController()
  let initPromise: Promise<void> | undefined
  let pickingSession: PickingSession | undefined

  const handleFilesPicked = async (
    files: PickedItem[],
    accessToken: string,
  ) => {
    uppy.addFiles(
      files.map((file) =>
        mapPickerFile({ requestClientId, accessToken, companionUrl }, file),
      ),
    )
  }

  function setAccessToken(newAccessToken: string | null) {
    store.setState((s) => ({ ...s, accessToken: newAccessToken }))
    if (newAccessToken == null) {
      return persistentStore.removeItem(storageKey)
    }
    return persistentStore.setItem(storageKey, newAccessToken)
  }

  function setLoading(v: boolean) {
    store.setState((s) => ({ ...s, loading: v }))
  }

  async function init() {
    abortController = new AbortController()

    setAccessToken(await persistentStore.getItem(storageKey))

    abortController.signal.throwIfAborted()

    // For google photos we need to continuously poll the current picking session
    if (pickerType === 'photos') {
      pollPickingSession({
        getPickingSession: () => pickingSession,
        getAccessToken: () => store.getSnapshot().accessToken,
        onPickingSessionClear: () => {
          pickingSession = undefined
        },
        signal: abortController.signal,
        onFilesPicked: handleFilesPicked,
        onError: (err) => uppy.log(err),
      })
    }
  }

  async function showPicker() {
    if (initPromise == null) initPromise = init()
    await initPromise

    let newAccessToken = store.getSnapshot().accessToken

    const doShowPicker = async (token: string) => {
      if (pickerType === 'drive') {
        if (apiKey == null || appId == null)
          throw new TypeError(
            'apiKey and appId are required for Google Drive picker',
          )
        await showDrivePicker({
          token,
          apiKey,
          appId,
          onFilesPicked: handleFilesPicked,
          signal: abortController.signal,
          onLoadingChange: (isLoading: boolean) => setLoading(isLoading),
          onError: (err: unknown) => {
            uppy.log(err)
            uppy.info(uppy.i18n('failedToAddFiles'), 'error')
          },
        })
      } else {
        // photos
        const onPickingSessionChange = (newPickingSession: PickingSession) => {
          pickingSession = newPickingSession
        }
        await showPhotosPicker({
          token,
          pickingSession,
          onPickingSessionChange,
          signal: abortController.signal,
        })
      }
    }

    setLoading(true)
    try {
      try {
        const client = new RequestClient(uppy, {
          companionUrl,
          companionHeaders,
          companionCookiesRule,
        })

        uppy.registerRequestClient(requestClientId, client)

        await ensureScriptsInjected(pickerType)

        if (newAccessToken == null) {
          newAccessToken = await authorize({ clientId, pickerType })
        }
        if (newAccessToken == null) throw new Error()

        await doShowPicker(newAccessToken)
        setAccessToken(newAccessToken)
      } catch (err) {
        if (err instanceof InvalidTokenError) {
          uppy.log('Token is invalid or expired, reauthenticating')
          newAccessToken = await authorize({
            pickerType,
            accessToken: newAccessToken,
            clientId,
          })
          // now try again:
          await doShowPicker(newAccessToken)
          setAccessToken(newAccessToken)
        } else {
          throw err
        }
      }
    } catch (err) {
      if (
        err instanceof Error &&
        'type' in err &&
        err.type === 'popup_closed'
      ) {
        // user closed the auth popup, ignore
      } else {
        setAccessToken(null)
        uppy.log(err)
      }
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    const { accessToken } = store.getSnapshot()
    if (accessToken) {
      await doLogout(accessToken)
      setAccessToken(null)
      pickingSession = undefined
    }
  }

  function reset() {
    abortController.abort()

    pickingSession = undefined
    initPromise = undefined
    store.setState((s) => ({ ...s, accessToken: undefined, loading: false }))
  }

  return {
    store,
    show: showPicker,
    reset,
    logout,
  }
}
