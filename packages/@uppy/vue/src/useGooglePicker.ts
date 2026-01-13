import {
  createGooglePickerController,
  type GooglePickerOptions,
} from '@uppy/components'
import { onUnmounted, type ShallowRef } from 'vue'
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
  companionHeaders,
  companionCookiesRule,
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
    companionHeaders,
    companionCookiesRule,
    pickerType,
    clientId,
    apiKey,
    appId,
  })

  const state = useExternalStore<GooglePickerSnapshot>(getSnapshot, subscribe)

  onUnmounted(() => {
    reset()
  })

  // Create a computed-like object that merges state with controller methods
  return {
    get value() {
      return {
        ...state.value,
        show,
        logout,
      }
    },
  } as ShallowRef<GooglePickerSnapshot & GooglePickerController>
}
