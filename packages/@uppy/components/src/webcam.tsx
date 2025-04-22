import { Fragment, h } from 'preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import UppyWebcam, {
  type WebcamOptions,
  type WebcamState,
  defaultOptions,
} from '@uppy/webcam'
import type { Meta, Body, UppyEventMap } from '@uppy/core'
import type { InjectedProps } from './types.js'

export type WebcamProps = WebcamOptions<Meta, Body> & InjectedProps

export default function Webcam(props: WebcamProps) {
  const options = useMemo(() => ({ ...defaultOptions, ...props }), [props])
  const { ctx, mirror, modes } = options
  const videoRef = useRef<HTMLVideoElement>(null)
  const plugin = ctx.uppy?.getPlugin<UppyWebcam<any, any>>('Webcam')
  if (plugin) {
    plugin.getVideoElement = () => videoRef.current
  }
  const [state, setState] = useState<WebcamState | undefined>(
    plugin?.getPluginState(),
  )

  useEffect(() => {
    if (!plugin) {
      ctx.uppy?.use(UppyWebcam, options)
    }
    // Start the camera if it's not active
    if (plugin && !plugin.webcamActive) {
      plugin.start()
    }
    return () => {
      if (plugin) {
        plugin.stop()
        // Using any type here to avoid type conflicts
        ctx.uppy?.removePlugin(plugin as any)
      }
    }
  }, [ctx.uppy, options, plugin])

  useEffect(() => {
    ctx.uppy?.getPlugin('Webcam')?.setOptions(options)
  }, [ctx.uppy, options])

  // Listen to state updates
  useEffect(() => {
    const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
      prev,
      next,
      patch,
    ) => {
      if (patch?.plugins?.Webcam) {
        setState(patch.plugins.Webcam as WebcamState)
      }
    }
    ctx.uppy?.on('state-update', onStateUpdate)
    return () => {
      ctx.uppy?.off('state-update', onStateUpdate)
    }
  }, [ctx.uppy])

  // Connect video stream to our element when ready
  useEffect(() => {
    if (state?.cameraReady && videoRef.current && plugin) {
      videoRef.current.srcObject = plugin.stream
    }
  }, [state?.cameraReady, ctx.uppy, plugin])

  // Render simple camera UI
  if (!state?.hasCamera) {
    return (
      <div className="uppy:flex uppy:flex-col uppy:items-center uppy:justify-center uppy:p-6 uppy:bg-gray-100 uppy:rounded-lg uppy:shadow-md">
        <div className="uppy:text-xl uppy:font-medium uppy:text-gray-800">
          No camera detected
        </div>
      </div>
    )
  }

  if (state?.cameraError) {
    return (
      <div className="uppy:flex uppy:flex-col uppy:items-center uppy:justify-center uppy:p-6 uppy:bg-gray-100 uppy:rounded-lg uppy:shadow-md">
        <div className="uppy:text-xl uppy:font-medium uppy:text-gray-800 uppy:mb-2">
          Camera access denied
        </div>
        <p className="uppy:text-gray-600">{state.cameraError.message}</p>
      </div>
    )
  }

  if (!state.cameraReady) {
    return (
      <div className="uppy:flex uppy:flex-col uppy:items-center uppy:justify-center uppy:p-6 uppy:bg-gray-100 uppy:rounded-lg uppy:shadow-md">
        <div className="uppy:text-xl uppy:font-medium uppy:text-gray-800">
          Requesting camera access...
        </div>
      </div>
    )
  }

  return (
    <div className="uppy:flex uppy:flex-col uppy:overflow-hidden uppy:bg-white uppy:rounded-lg uppy:shadow-lg">
      <div className="uppy:flex uppy:justify-center uppy:items-center uppy:bg-black uppy:aspect-video">
        <video
          className="uppy:w-full uppy:h-full uppy:object-cover"
          autoPlay
          muted
          playsInline
          ref={videoRef}
          style={{
            transform: mirror ? 'scaleX(-1)' : undefined,
          }}
        />
      </div>
      <div className="uppy:flex uppy:flex-wrap uppy:gap-2 uppy:p-3 uppy:bg-gray-50">
        <button
          className="uppy:flex-1 uppy:py-2 uppy:px-4 uppy:bg-blue-500 uppy:hover:bg-blue-600 uppy:text-white uppy:font-medium uppy:rounded-md uppy:transition-colors uppy:focus:outline-none uppy:focus:ring-2 uppy:focus:ring-blue-300"
          type="button"
          onClick={() => plugin?.takeSnapshot()}
          title="Take a picture"
          aria-label="Take a picture"
        >
          Take photo
        </button>
        {modes && modes.includes('video-only') && (
          <Fragment>
            <button
              className={`uppy:flex-1 uppy:py-2 uppy:px-4 uppy:font-medium uppy:rounded-md uppy:transition-colors uppy:focus:outline-none ${
                state.isRecording ?
                  'uppy:bg-gray-400 uppy:text-gray-700 uppy:cursor-not-allowed'
                : 'uppy:bg-red-500 uppy:hover:bg-red-600 uppy:text-white uppy:focus:ring-2 uppy:focus:ring-red-300'
              }`}
              type="button"
              onClick={() => plugin?.startRecording()}
              title="Start recording"
              aria-label="Start recording"
              disabled={state?.isRecording}
            >
              Record
            </button>
            <button
              className={`uppy:flex-1 uppy:py-2 uppy:px-4 uppy:font-medium uppy:rounded-md uppy:transition-colors uppy:focus:outline-none ${
                !state.isRecording ?
                  'uppy:bg-gray-400 uppy:text-gray-700 uppy:cursor-not-allowed'
                : 'uppy:bg-gray-700 uppy:hover:bg-gray-800 uppy:text-white uppy:focus:ring-2 uppy:focus:ring-gray-500'
              }`}
              type="button"
              onClick={() => plugin?.stopRecording()}
              title="Stop recording"
              aria-label="Stop recording"
              disabled={!state?.isRecording}
            >
              Stop
            </button>
          </Fragment>
        )}
      </div>
    </div>
  )
}
