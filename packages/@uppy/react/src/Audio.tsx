import { useEffect, useRef, useContext, createElement as h } from 'react'
import { Audio as PreactAudio, type AudioProps } from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { UppyContext as ReactUppyContext } from './UppyContextProvider.js'

export default function Audio(props: Omit<AudioProps, 'render' | 'ctx'>) {
  const ref = useRef(null)
  const ctx = useContext(ReactUppyContext)

  useEffect(() => {
    if (ref.current) {
      preactRender(
        preactH(PreactAudio, {
          ...props,
          ctx,
        } satisfies AudioProps),
        ref.current,
      )
    }
  }, [ctx, props])

  return h('div', { ref })
}
