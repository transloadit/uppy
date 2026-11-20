import { onDestroy } from 'svelte'

export function useExternalStore<T>(
  getSnapshot: () => T,
  subscribe: (callback: () => void) => () => void,
): { value: T } {
  let value = $state(getSnapshot())

  // Subscribe immediately instead of waiting for mount
  const unsubscribe = subscribe(() => {
    value = getSnapshot()
  })

  onDestroy(() => {
    unsubscribe()
  })

  return {
    get value() {
      return value
    },
  }
}
