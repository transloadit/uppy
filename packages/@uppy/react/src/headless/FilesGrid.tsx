import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  FilesGrid as PreactFilesGrid,
  type FilesGridProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function FilesGrid(
  props: Omit<FilesGridProps, 'ctx' | 'render'>,
) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactFilesGrid, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies FilesGridProps),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
