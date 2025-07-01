import type { ShallowRef } from 'vue'
import { onUnmounted, shallowRef } from 'vue'

export function useExternalStore<T>(
  getSnapshot: () => T,
  subscribe: (callback: () => void) => () => void,
): ShallowRef<T> {
  const state = shallowRef(getSnapshot())

  // Subscribe immediately instead of waiting for mount
  const unsubscribe = subscribe(() => {
    state.value = getSnapshot() as T
  })

  onUnmounted(() => {
    unsubscribe()
  })

  return state
}
