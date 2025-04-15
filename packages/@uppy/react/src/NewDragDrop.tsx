import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  DragDrop as PreactDragDrop,
  type DragDropProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function DragDrop({
  width,
  height,
  note,
  noClick,
  child,
}: Omit<DragDropProps, 'ctx' | 'render'>) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactDragDrop, {
          width,
          height,
          note,
          noClick,
          ctx,
          child,
          render: reactRender,
        } satisfies DragDropProps),
        ref.current,
      )
    }
  }, [ctx, width, height, note, noClick, child, reactRender])

  return <div ref={ref} />
}
