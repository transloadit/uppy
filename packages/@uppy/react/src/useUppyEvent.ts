import type { Uppy, UppyEventMap } from '@uppy/core'
import type { Meta, Body } from '@uppy/utils/lib/UppyFile'
import { useEffect, useState } from 'react'

type EventResults<
  M extends Meta,
  B extends Body,
  K extends keyof UppyEventMap<M, B>,
> = Parameters<UppyEventMap<M, B>[K]>

export default function useUppyEvent<
  M extends Meta,
  B extends Body,
  K extends keyof UppyEventMap<M, B>,
>(
  uppy: Uppy<M, B>,
  event: K,
  callback?: (...args: EventResults<M, B, K>) => void,
): [EventResults<M, B, K> | [], () => void] {
  const [result, setResult] = useState<EventResults<M, B, K> | []>([])
  const clear = () => setResult([])

  useEffect(() => {
    const handler = ((...args: EventResults<M, B, K>) => {
      setResult(args)
      // eslint-disable-next-line node/no-callback-literal
      callback?.(...args)
    }) as UppyEventMap<M, B>[K]

    uppy.on(event, handler)

    return function cleanup() {
      uppy.off(event, handler)
    }
  }, [uppy, event, callback])

  return [result, clear]
}
