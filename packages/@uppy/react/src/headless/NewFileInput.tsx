import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  NewFileInput as PreactNewFileInput,
  type NewFileInputProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'

export default function NewFileInput(props: NewFileInputProps) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactNewFileInput, {
          ...props,
          ctx,
        } satisfies NewFileInputProps),
        ref.current,
      )
    }
  }, [ctx, props])

  return <div ref={ref} />
}
