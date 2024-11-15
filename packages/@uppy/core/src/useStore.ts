import { useCallback, useEffect, useState } from 'preact/hooks'

import type { AsyncStore } from './Uppy'

export default function useStore(
  store: AsyncStore,
  key: string,
): [string | undefined | null, (v: string | null) => Promise<void>] {
  const [value, setValueState] = useState<string | null | undefined>()
  useEffect(() => {
    ;(async () => {
      setValueState(await store.getItem(key))
    })()
  }, [key, store])

  const setValue = useCallback(
    async (v: string | null) => {
      setValueState(v)
      if (v == null) {
        return store.removeItem(key)
      }
      return store.setItem(key, v)
    },
    [key, store],
  )

  return [value, setValue]
}
