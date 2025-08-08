import { useScreenCapture } from '@uppy/react'
import { useEffect } from 'react'
import MediaCapture from './MediaCapture.tsx'

export interface ScreenCaptureProps {
  close: () => void
}

export function ScreenCapture({ close }: ScreenCaptureProps) {
  const {
    start,
    stop,
    getVideoProps,
    getScreenshotButtonProps,
    getRecordButtonProps,
    getStopRecordingButtonProps,
    getSubmitButtonProps,
    getDiscardButtonProps,
    state,
  } = useScreenCapture({ onSubmit: close })

  useEffect(() => {
    start()
    return () => {
      stop()
    }
  }, [start, stop])

  return (
    <MediaCapture
      title="Screen Capture"
      close={close}
      mediaError={state.screenRecError}
      getVideoProps={getVideoProps}
      getPrimaryActionButtonProps={getScreenshotButtonProps}
      primaryActionButtonLabel="Screenshot"
      getRecordButtonProps={getRecordButtonProps}
      getStopRecordingButtonProps={getStopRecordingButtonProps}
      getSubmitButtonProps={getSubmitButtonProps}
      getDiscardButtonProps={getDiscardButtonProps}
    />
  )
}

export default ScreenCapture
