import { useEffect, useRef, useContext, createElement as h } from 'react'
import type { WebcamOptions } from '@uppy/webcam'
import type { Meta, Body } from '@uppy/core'
import { Webcam as PreactWebcam, type WebcamProps } from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'

export default function Webcam(
  props: Omit<WebcamOptions<Meta, Body>, 'target'>,
) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactWebcam, {
          ...props,
          ctx,
        } satisfies WebcamProps),
        ref.current,
      )
    }
  }, [ctx, props])

  return <div ref={ref} />
}
