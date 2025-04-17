import { h } from 'preact'
import { useRef, useEffect } from 'preact/hooks'
import UppyAudio, { type AudioOptions } from '@uppy/audio'
import type { UppyContext } from './types.js'

export type AudioProps = AudioOptions & {
  ctx: UppyContext
}

export default function Audio(props: AudioProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { ctx } = props

  useEffect(() => {
    if (!ctx.uppy?.getPlugin('Audio')) {
      ctx.uppy?.use(UppyAudio, {
        ...props,
        target: ref.current ?? undefined,
      })
    }
  }, [ctx.uppy, props])

  useEffect(() => {
    ctx.uppy?.getPlugin('Audio')?.setOptions(props)
  }, [ctx.uppy, props])

  useEffect(() => {
    return () => {
      const plugin = ctx.uppy?.getPlugin('Audio')
      if (plugin) {
        ctx.uppy?.removePlugin(plugin)
      }
    }
  }, [ctx.uppy])

  return (
    <>
      <div id="uppy-audio-container" ref={ref} />

      <style>{`
    #uppy-audio-container audio,
    #uppy-audio-container canvas {
        position: initial;
    }

`}</style>
    </>
  )
}
