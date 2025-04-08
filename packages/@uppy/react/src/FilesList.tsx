import { useEffect, useRef, createElement as h, useContext } from 'react'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import {
  FilesList as PreactFilesList,
  type FilesListProps,
} from '@uppy/components'
// eslint-disable-next-line import/no-extraneous-dependencies
import { createRoot } from 'react-dom/client'
import { UppyContext } from './UppyContextProvider.js'

function useReactRender() {
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null)

  const reactRender = (el: Element | null, node: any) => {
    if (!rootRef.current && el) {
      rootRef.current = createRoot(el)
    }
    rootRef.current?.render(node)
  }

  return reactRender
}

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
