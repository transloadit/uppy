import { useEffect, useRef, createElement as h } from 'react'
import {
  Thumbnail as PreactThumbnail,
  type ThumbnailProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import useReactRender from './useReactRender.js'

export default function Thumbnail(props: ThumbnailProps) {
  const ref = useRef(null)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactThumbnail, {
          ...props,
          render: reactRender,
        } as ThumbnailProps),
        ref.current,
      )
    }
  }, [props, reactRender])

  return <div ref={ref} />
}
