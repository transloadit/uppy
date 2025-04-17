import { useEffect, useRef, useContext, createElement as h } from 'react'
import {
  ProviderIcon as PreactProviderIcon,
  type ProviderIconProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function ProviderIcon(
  props: Omit<ProviderIconProps, 'ctx' | 'render'>,
) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactProviderIcon, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies ProviderIconProps),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
