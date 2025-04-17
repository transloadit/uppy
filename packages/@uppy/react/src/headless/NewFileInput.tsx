import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  NewFileInput as PreactNewFileInput,
  type NewFileInputProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function NewFileInput(
  props: Omit<NewFileInputProps, 'ctx' | 'render'>,
) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactNewFileInput, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies NewFileInputProps),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
