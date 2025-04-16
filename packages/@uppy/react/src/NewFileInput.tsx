import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  FileInput as PreactFileInput,
  type FileInputProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function FileInput({
  multiple,
  accept,
  child,
  className,
}: Omit<FileInputProps, 'render' | 'ctx'>) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactFileInput, {
          multiple,
          accept,
          child,
          className,
          ctx,
          render: reactRender,
        } satisfies FileInputProps),
        ref.current,
      )
    }
  }, [ctx, multiple, accept, child, className, reactRender])

  return h('div', { ref })
}
