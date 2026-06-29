import {
  createGooglePickerController,
  createGooglePickerPluginAdapter,
  type GooglePickerOptions,
} from '@uppy/components'

import { useEffect, useMemo } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import { useUppyContext } from './headless/UppyContextProvider.js'

export function useGooglePicker({
  pickerType,
  storage,
}: Pick<GooglePickerOptions, 'pickerType' | 'storage'>) {
  const { uppy } = useUppyContext()

  const { store, opts } = useMemo(
    () => createGooglePickerPluginAdapter(uppy, pickerType),
    [uppy, pickerType],
  )

  const { subscribe, getSnapshot } = store

  const { reset, init, ...rest } = useMemo(
    () =>
      createGooglePickerController({
        uppy,
        pickerType,
        storage,
        store,
        ...opts,
      }),
    [uppy, pickerType, storage, store, opts],
  )

  useEffect(() => {
    init()

    return () => {
      reset()
    }
  }, [reset, init])

  return {
    ...useSyncExternalStore(subscribe, getSnapshot, getSnapshot),
    ...rest,
  }
}
