import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  Thumbnail as PreactThumbnail,
  type ThumbnailProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function Thumbnail(
  props: Omit<ThumbnailProps, 'ctx' | 'render'>,
) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactThumbnail, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies ThumbnailProps),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
