import { useEffect, useRef, createElement as h, useContext } from 'react'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import {
  FilesList as PreactFilesList,
  type FilesListProps,
} from '@uppy/components'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function FilesList({
  editFile,
  item,
}: Omit<FilesListProps, 'ctx' | 'render'>) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactFilesList, {
          editFile,
          ctx,
          item,
          render: reactRender,
        } satisfies FilesListProps),
        ref.current,
      )
    }
  }, [ctx, editFile, item, reactRender])

  return <div ref={ref} />
}
