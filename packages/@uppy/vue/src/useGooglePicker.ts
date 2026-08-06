import {
  createGooglePickerController,
  createGooglePickerPluginAdapter,
  type GooglePickerOptions,
} from '@uppy/components'
import { computed, onMounted, onUnmounted, type ShallowRef } from 'vue'
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
  pickerType,
  storage,
}: Pick<GooglePickerOptions, 'pickerType' | 'storage'>): ShallowRef<
  GooglePickerSnapshot & GooglePickerController
> {
  const ctx = injectUppyContext()

  const { store, opts } = createGooglePickerPluginAdapter(ctx.uppy, pickerType)

  const { subscribe, getSnapshot } = store

  const { reset, init, show, logout } = createGooglePickerController({
    uppy: ctx.uppy,
    pickerType,
    store,
    storage,
    ...opts,
  })

  const state = useExternalStore<GooglePickerSnapshot>(getSnapshot, subscribe)

  onMounted(() => {
    init()
  })

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
