import { h } from 'preact'
import { useContext, useRef, useEffect } from 'preact/hooks'
import UppyAudio, { type AudioOptions } from '@uppy/audio'
import { UppyContext } from './index.js'

function Audio(props: AudioOptions) {
  const ref = useRef<HTMLDivElement>(null)

  const ctx = useContext(UppyContext)

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

export default Audio
