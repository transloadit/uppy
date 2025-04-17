import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  UploadButton as PreactUploadButton,
  type UploadButtonProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function UploadButton(
  props: Omit<UploadButtonProps, 'ctx' | 'render'>,
) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactUploadButton, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies UploadButtonProps),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
