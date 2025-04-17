import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  Dropzone as PreactDropzone,
  type DropzoneProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function Dropzone(props: Omit<DropzoneProps, 'ctx' | 'render'>) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactDropzone, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies DropzoneProps),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
