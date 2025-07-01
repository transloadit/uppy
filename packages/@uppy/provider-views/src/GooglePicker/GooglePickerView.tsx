import type { AsyncStore, Uppy } from '@uppy/core'
import type { I18n } from '@uppy/utils/lib/Translator'
import { h } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import AuthView from '../ProviderView/AuthView.js'
import {
  authorize,
  ensureScriptsInjected,
  InvalidTokenError,
  logout,
  type PickedItem,
  type PickingSession,
  pollPickingSession,
  showDrivePicker,
  showPhotosPicker,
} from './googlePicker.js'
import { GoogleDriveIcon, GooglePhotosIcon } from './icons.js'

function useStore(
  store: AsyncStore,
  key: string,
): [string | undefined | null, (v: string | null) => Promise<void>] {
  const [value, setValueState] = useState<string | null | undefined>()
  useEffect(() => {
    ;(async () => {
      setValueState(await store.getItem(key))
    })()
  }, [key, store])

  const setValue = useCallback(
    async (v: string | null) => {
      setValueState(v)
      if (v == null) {
        return store.removeItem(key)
      }
      return store.setItem(key, v)
    },
    [key, store],
  )

  return [value, setValue]
}

export type GooglePickerViewProps = {
  uppy: Uppy<any, any>
  i18n: I18n
  clientId: string
  onFilesPicked: (files: PickedItem[], accessToken: string) => void
  storage: AsyncStore
} & (
  | {
      pickerType: 'drive'
      apiKey: string
      appId: string
    }
  | {
      pickerType: 'photos'
      apiKey?: undefined
      appId?: undefined
    }
)

export default function GooglePickerView({
  uppy,
  i18n,
  clientId,
  onFilesPicked,
  pickerType,
  apiKey,
  appId,
  storage,
}: GooglePickerViewProps) {
  const [loading, setLoading] = useState(false)
  const [accessToken, setAccessTokenStored] = useStore(
    storage,
    `uppy:google-${pickerType}-picker:accessToken`,
  )

  const pickingSessionRef = useRef<PickingSession>()
  const accessTokenRef = useRef(accessToken)
  const shownPickerRef = useRef(false)

  const setAccessToken = useCallback(
    (t: string | null) => {
      uppy.log('Access token updated')
      setAccessTokenStored(t)
      accessTokenRef.current = t
    },
    [setAccessTokenStored, uppy],
  )

  // keep access token in sync with the ref
  useEffect(() => {
    accessTokenRef.current = accessToken
  }, [accessToken])

  const showPicker = useCallback(
    async (signal?: AbortSignal) => {
      let newAccessToken = accessToken

      const doShowPicker = async (token: string) => {
        if (pickerType === 'drive') {
          await showDrivePicker({
            token,
            apiKey,
            appId,
            onFilesPicked,
            signal,
          })
        } else {
          // photos
          const onPickingSessionChange = (
            newPickingSession: PickingSession,
          ) => {
            pickingSessionRef.current = newPickingSession
          }
          await showPhotosPicker({
            token,
            pickingSession: pickingSessionRef.current,
            onPickingSessionChange,
            signal,
          })
        }
      }

      setLoading(true)
      try {
        try {
          await ensureScriptsInjected(pickerType)

          if (newAccessToken == null) {
            newAccessToken = await authorize({ clientId, pickerType })
          }
          if (newAccessToken == null) throw new Error()

          await doShowPicker(newAccessToken)
          shownPickerRef.current = true
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
            shownPickerRef.current = true
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
    },
    [
      accessToken,
      apiKey,
      appId,
      clientId,
      onFilesPicked,
      pickerType,
      setAccessToken,
      uppy,
    ],
  )

  useEffect(() => {
    const abortController = new AbortController()

    pollPickingSession({
      pickingSessionRef,
      accessTokenRef,
      signal: abortController.signal,
      onFilesPicked,
      onError: (err) => uppy.log(err),
    })

    return () => abortController.abort()
  }, [onFilesPicked, uppy])

  useEffect(() => {
    // when mounting, once we have a token, be nice to the user and automatically show the picker
    // accessToken === undefined means not yet loaded from storage, so wait for that first
    if (accessToken === undefined || shownPickerRef.current) {
      return undefined
    }

    const abortController = new AbortController()

    showPicker(abortController.signal)

    return () => {
      // only abort the picker if it's not yet shown
      if (!shownPickerRef.current) abortController.abort()
    }
  }, [accessToken, showPicker])

  const handleLogoutClick = useCallback(async () => {
    if (accessToken) {
      await logout(accessToken)
      setAccessToken(null)
      pickingSessionRef.current = undefined
    }
  }, [accessToken, setAccessToken])

  if (loading) {
    return <div>{i18n('pleaseWait')}...</div>
  }

  if (accessToken == null) {
    return (
      <AuthView
        pluginName={
          pickerType === 'drive'
            ? i18n('pluginNameGoogleDrivePicker')
            : i18n('pluginNameGooglePhotosPicker')
        }
        pluginIcon={pickerType === 'drive' ? GoogleDriveIcon : GooglePhotosIcon}
        handleAuth={showPicker}
        i18n={i18n}
        loading={loading}
      />
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn uppy-c-btn-primary"
        style={{ display: 'block', marginBottom: '1em' }}
        disabled={loading}
        onClick={() => showPicker()}
      >
        {pickerType === 'drive' ? i18n('pickFiles') : i18n('pickPhotos')}
      </button>
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        disabled={loading}
        onClick={handleLogoutClick}
      >
        {i18n('logOut')}
      </button>
    </div>
  )
}
