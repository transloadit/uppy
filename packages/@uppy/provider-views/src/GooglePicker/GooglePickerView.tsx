import { h } from 'preact'
import { Fragment } from 'preact/compat'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'

import type { Uppy } from '@uppy/core'
import useStore from '@uppy/core/lib/useStore.js'
import type { AsyncStore } from '@uppy/core/lib/Uppy.js'

import {
  authorize,
  ensureScriptsInjected,
  InvalidTokenError,
  logout,
  pollPickingSession,
  showDrivePicker,
  showPhotosPicker,
  type PickedItem,
  type PickingSession,
} from './googlePicker.js'

export type GooglePickerViewProps = {
  uppy: Uppy<any, any>
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
      shownPickerRef.current = true
      let newAccessToken = accessToken

      const doShowPicker = async (token: string) => {
        if (pickerType === 'drive') {
          await showDrivePicker({ token, apiKey, appId, onFilesPicked, signal })
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

    return () => abortController.abort()
  }, [accessToken, showPicker])

  const handleLogoutClick = useCallback(async () => {
    if (accessToken) {
      await logout(accessToken)
      setAccessToken(null)
      pickingSessionRef.current = undefined
    }
  }, [accessToken, setAccessToken])

  if (loading) {
    return <div>{uppy.i18n('pleaseWait')}...</div>
  }

  if (accessToken == null) {
    return (
      <button type="button" disabled={loading} onClick={() => showPicker()}>
        {uppy.i18n('logIn')}
      </button>
    )
  }

  return (
    <>
      <button type="button" disabled={loading} onClick={() => showPicker()}>
        {pickerType === 'drive' ?
          uppy.i18n('pickFiles')
        : uppy.i18n('pickPhotos')}
      </button>
      <button type="button" disabled={loading} onClick={handleLogoutClick}>
        {uppy.i18n('logOut')}
      </button>
    </>
  )
}
