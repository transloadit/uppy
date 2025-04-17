import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  FilesList as PreactFilesList,
  type FilesListProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function FilesList(
  props: Omit<FilesListProps, 'ctx' | 'render'>,
) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactFilesList, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies FilesListProps),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
