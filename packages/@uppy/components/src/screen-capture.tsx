import { h } from 'preact'
import { useContext, useRef, useEffect } from 'preact/hooks'
import UppyScreenCapture, {
  type ScreenCaptureOptions,
} from '@uppy/screen-capture'
import { UppyContext } from './index.js'

function ScreenCapture(props: ScreenCaptureOptions) {
  const ref = useRef<HTMLDivElement>(null)

  const ctx = useContext(UppyContext)

  useEffect(() => {
    if (!ctx.uppy?.getPlugin('ScreenCapture')) {
      ctx.uppy?.use(UppyScreenCapture, {
        ...props,
        target: ref.current ?? undefined,
      })
    }
  }, [ctx.uppy, props])

  useEffect(() => {
    ctx.uppy?.getPlugin('ScreenCapture')?.setOptions(props)
  }, [ctx.uppy, props])

  useEffect(() => {
    return () => {
      const plugin = ctx.uppy?.getPlugin('ScreenCapture')
      if (plugin) {
        ctx.uppy?.removePlugin(plugin)
      }
    }
  }, [ctx.uppy])

  return (
    <>
      <div id="uppy-screen-capture-container" ref={ref} />

      <style>{`
    #uppy-screen-capture-container video {
        position: initial;
    }

`}</style>
    </>
  )
}

export default ScreenCapture
