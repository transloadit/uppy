import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  ScreenCapture as PreactScreenCapture,
  type ScreenCaptureProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function ScreenCapture(
  props: Omit<ScreenCaptureProps, 'ctx' | 'render'>,
) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactScreenCapture, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies ScreenCaptureProps),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
