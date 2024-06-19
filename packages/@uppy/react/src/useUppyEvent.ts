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
>(uppy: Uppy<M, B>, event: K): EventResults<M, B, K> | [] {
  const [result, setResult] = useState<EventResults<M, B, K> | []>([])

  useEffect(() => {
    const handler = ((...args: EventResults<M, B, K>) => {
      setResult(args)
    }) as UppyEventMap<M, B>[K]

    uppy.on(event, handler)

    return function cleanup() {
      uppy.off(event, handler)
    }
  }, [uppy, event])

  return result
}
