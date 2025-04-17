import { useEffect, useRef, useContext, createElement as h } from 'react'
import { Audio as PreactAudio, type AudioProps } from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext } from './UppyContextProvider.js'
import useReactRender from './useReactRender.js'

export default function Audio(props: Omit<AudioProps, 'ctx' | 'render'>) {
  const ref = useRef(null)
  const ctx = useContext(UppyContext)
  const reactRender = useReactRender()

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactAudio, {
          ...props,
          ctx,
          render: reactRender,
        } satisfies AudioProps),
        ref.current,
      )
    }
  }, [ctx, props, reactRender])

  return <div ref={ref} />
}
