import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  FilesGrid as PreactFilesGrid,
  type FilesGridProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function FilesGrid({
  item,
  editFile,
  columns,
}: Omit<FilesGridProps, 'render' | 'ctx'>) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactFilesGrid, {
          item,
          editFile,
          columns,
          ctx,
          render: reactRender,
        } satisfies FilesGridProps),
        ref.current,
      )
    }
  }, [ctx, item, editFile, columns, reactRender])

  return h('div', { ref })
}
