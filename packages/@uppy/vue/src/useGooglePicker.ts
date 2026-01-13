import {
  createGooglePickerController,
  type GooglePickerOptions,
} from '@uppy/components'
import { computed, onUnmounted, type ShallowRef } from 'vue'
import { injectUppyContext } from './headless/context-provider.js'
import { useExternalStore } from './useSyncExternalStore.js'

type GooglePickerSnapshot = {
  loading: boolean
  accessToken: string | null | undefined
}

type GooglePickerController = {
  show: () => Promise<void>
  logout: () => Promise<void>
}

export function useGooglePicker({
  requestClientId,
  companionUrl,
  pickerType,
  clientId,
  apiKey,
  appId,
}: GooglePickerOptions): ShallowRef<
  GooglePickerSnapshot & GooglePickerController
> {
  const ctx = injectUppyContext()

  const {
    store: { subscribe, getSnapshot },
    reset,
    show,
    logout,
  } = createGooglePickerController({
    uppy: ctx.uppy,
    requestClientId,
    companionUrl,
    pickerType,
    clientId,
    apiKey,
    appId,
  })

  const state = useExternalStore<GooglePickerSnapshot>(getSnapshot, subscribe)

  onUnmounted(() => {
    reset()
  })

  // Merge state with controller methods using computed for better type safety
  return computed(() => ({
    ...state.value,
    show,
    logout,
  })) as ShallowRef<GooglePickerSnapshot & GooglePickerController>
}
