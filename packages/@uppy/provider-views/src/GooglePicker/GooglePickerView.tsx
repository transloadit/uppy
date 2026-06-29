import {
  type CompanionPluginOptions,
  createGooglePickerController,
  createGooglePickerStoreAdapter,
  type GooglePickerOptions,
  type GooglePickerState,
} from '@uppy/companion-client'
import type { AsyncStore, Uppy } from '@uppy/core'
import type { I18n } from '@uppy/utils'
import { useSyncExternalStore } from 'preact/compat'
import { useEffect, useMemo, useRef } from 'preact/hooks'
import AuthView from '../ProviderView/AuthView.js'
import { GoogleDriveIcon, GooglePhotosIcon } from './icons.js'

export function useGooglePicker({
  uppy,
  requestClientId,
  companionUrl,
  pickerType,
  clientId,
  apiKey,
  appId,
  storage,
  store,
}: GooglePickerOptions & { uppy: Uppy<any, any> } & Pick<
    CompanionPluginOptions,
    'companionUrl'
  >) {
  const { subscribe, getSnapshot } = store

  const { reset, init, ...rest } = useMemo(
    () =>
      createGooglePickerController({
        uppy,
        requestClientId,
        companionUrl,
        pickerType,
        clientId,
        apiKey,
        appId,
        storage,
        store,
      }),
    [
      uppy,
      requestClientId,
      clientId,
      companionUrl,
      pickerType,
      apiKey,
      appId,
      storage,
      store,
    ],
  )

  useEffect(() => {
    init()
    return () => {
      reset()
    }
  }, [reset, init])

  return { ...useSyncExternalStore(subscribe, getSnapshot), ...rest }
}

export type GooglePickerViewProps = {
  setPluginState: (state: Partial<GooglePickerState>) => void
  getPluginState: () => GooglePickerState
  uppy: Uppy<any, any>
  i18n: I18n
  clientId: string
  requestClientId: string
  companionUrl: CompanionPluginOptions['companionUrl']
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
  getPluginState,
  setPluginState,
  uppy,
  i18n,
  clientId,
  pickerType,
  apiKey,
  appId,
  storage,
  requestClientId,
  companionUrl,
}: GooglePickerViewProps) {
  const store = useMemo(
    () =>
      createGooglePickerStoreAdapter({ uppy, getPluginState, setPluginState }),
    [uppy, getPluginState, setPluginState],
  )

  const googlePicker = useGooglePicker({
    uppy,
    requestClientId,
    companionUrl,
    pickerType,
    clientId,
    apiKey,
    appId,
    storage,
    store,
  })

  const shownPickerRef = useRef(false)

  useEffect(() => {
    // when mounting, once we have a token, be nice to the user and automatically show the picker
    // googlePicker.accessToken === undefined means not yet loaded from storage, so wait for that first
    if (googlePicker.accessToken === undefined || shownPickerRef.current) {
      return
    }
    shownPickerRef.current = true
    googlePicker.show()
  }, [googlePicker.show, googlePicker.accessToken])

  if (googlePicker.loading) {
    return <div>{i18n('pleaseWait')}...</div>
  }

  if (googlePicker.accessToken == null) {
    return (
      <AuthView
        pluginName={
          pickerType === 'drive'
            ? i18n('pluginNameGoogleDrivePicker')
            : i18n('pluginNameGooglePhotosPicker')
        }
        pluginIcon={pickerType === 'drive' ? GoogleDriveIcon : GooglePhotosIcon}
        handleAuth={googlePicker.show}
        i18n={i18n}
        loading={googlePicker.loading}
      />
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn uppy-c-btn-primary"
        style={{ display: 'block', marginBottom: '1em' }}
        disabled={googlePicker.loading}
        onClick={googlePicker.show}
      >
        {pickerType === 'drive' ? i18n('pickFiles') : i18n('pickPhotos')}
      </button>
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        disabled={googlePicker.loading}
        onClick={googlePicker.logout}
      >
        {i18n('logOut')}
      </button>
    </div>
  )
}
