import { useEffect, useRef } from 'react'
import { Uppy as UppyCore } from '@uppy/core'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'

/**
 * @deprecated Initialize Uppy outside of the component.
 */
export default function useUppy<M extends Meta, B extends Body>(
  factory: () => UppyCore<M, B>,
): UppyCore<M, B> | undefined {
  if (typeof factory !== 'function') {
    throw new TypeError(
      'useUppy: expected a function that returns a new Uppy instance',
    )
  }

  const uppy = useRef<UppyCore<M, B> | undefined>(undefined)
  if (uppy.current === undefined) {
    uppy.current = factory()

    if (!(uppy.current instanceof UppyCore)) {
      throw new TypeError(
        `useUppy: factory function must return an Uppy instance, got ${typeof uppy.current}`,
      )
    }
  }

  useEffect(() => {
    return () => {
      uppy.current?.close({ reason: 'unmount' })
      uppy.current = undefined
    }
  }, [uppy])

  return uppy.current
}
