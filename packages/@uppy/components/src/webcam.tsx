import { h } from 'preact'
import { useContext, useRef, useEffect } from 'preact/hooks'
import UppyWebcam, { type WebcamOptions } from '@uppy/webcam'
import type { Meta, Body } from '@uppy/core'
import { UppyContext } from './index.js'

function Webcam(props: WebcamOptions<Meta, Body>) {
  const ref = useRef<HTMLDivElement>(null)
  const ctx = useContext(UppyContext)

  useEffect(() => {
    if (!ctx.uppy?.getPlugin('Webcam')) {
      ctx.uppy?.use(UppyWebcam, {
        ...props,
        target: ref.current ?? undefined,
      })
    }
  }, [ctx.uppy, props])

  useEffect(() => {
    ctx.uppy?.getPlugin('Webcam')?.setOptions(props)
  }, [ctx.uppy, props])

  useEffect(() => {
    return () => {
      const plugin = ctx.uppy?.getPlugin('Webcam')
      if (plugin) {
        ctx.uppy?.removePlugin(plugin)
      }
    }
  }, [ctx.uppy])

  return (
    <>
      <div id="uppy-webcam-container" ref={ref} />

      <style>{`
    #uppy-webcam-container video {
        position: initial;
    }

`}</style>
    </>
  )
}

export default Webcam
