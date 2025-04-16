import { useEffect, useRef, useContext, createElement as h } from 'react'
import type { ScreenCaptureOptions } from '@uppy/screen-capture'
import {
  ScreenCapture as PreactScreenCapture,
  type ScreenCaptureProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'

export default function ScreenCapture(
  props: Omit<ScreenCaptureOptions, 'target'>,
) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactScreenCapture, {
          ...props,
          ctx,
        } satisfies ScreenCaptureProps),
        ref.current,
      )
    }
  }, [ctx, props])

  return <div ref={ref} />
}
