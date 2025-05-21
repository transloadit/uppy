import { onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

export function useExternalStore<T>(
  getSnapshot: () => T,
  subscribe: (callback: () => void) => () => void,
): Ref<T> {
  const state = ref(getSnapshot()) as Ref<T>

  // Subscribe immediately instead of waiting for mount
  const unsubscribe = subscribe(() => {
    state.value = getSnapshot() as T
  })

  onUnmounted(() => {
    unsubscribe()
  })

  return state
}
