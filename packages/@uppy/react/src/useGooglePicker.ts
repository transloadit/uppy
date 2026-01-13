import {
  createGooglePickerController,
  type GooglePickerOptions,
} from '@uppy/components'

import { useEffect, useMemo } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import { useUppyContext } from './headless/UppyContextProvider.js'

export function useGooglePicker({
  requestClientId,
  companionUrl,
  pickerType,
  clientId,
  apiKey,
  appId,
}: GooglePickerOptions) {
  const { uppy } = useUppyContext()

  const {
    store: { subscribe, getSnapshot },
    reset,
    ...rest
  } = useMemo(
    () =>
      createGooglePickerController({
        uppy,
        requestClientId,
        companionUrl,
        pickerType,
        clientId,
        apiKey,
        appId,
      }),
    [uppy, requestClientId, clientId, companionUrl, pickerType, apiKey, appId],
  )

  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => () => reset(), [reset])

  return { ...store, ...rest }
}
