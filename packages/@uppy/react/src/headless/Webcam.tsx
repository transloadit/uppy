import { useEffect, useRef, useContext, createElement as h } from 'react'
import { Webcam as PreactWebcam, type WebcamProps } from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function Webcam(props: Omit<WebcamProps, 'ctx' | 'render'>) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactWebcam, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies WebcamProps),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
