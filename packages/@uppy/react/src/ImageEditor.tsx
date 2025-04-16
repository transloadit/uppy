import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  ImageEditor as PreactImageEditor,
  type ImageEditorProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function ImageEditor({
  file,
  onSave,
  child,
  ...props
}: Omit<ImageEditorProps, 'render' | 'ctx'>) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactImageEditor, {
          file,
          onSave,
          child,
          ...props,
          ctx,
          render: reactRender,
        } satisfies ImageEditorProps),
        ref.current,
      )
    }
  }, [ctx, file, onSave, child, props, reactRender])

  return h('div', { ref })
}
