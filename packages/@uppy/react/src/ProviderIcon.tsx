import { useEffect, useRef, createElement as h } from 'react'
import {
  ProviderIcon as PreactProviderIcon,
  type ProviderIconProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import useReactRender from './useReactRender.js'

export default function ProviderIcon({ provider, fill }: ProviderIconProps) {
  const ref = useRef(null)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactProviderIcon, {
          provider,
          fill,
        } satisfies ProviderIconProps),
        ref.current,
      )
    }
  }, [provider, fill, reactRender])

  return h('div', { ref })
}
