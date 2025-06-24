/* eslint-disable react/react-in-jsx-scope */
import React, { useEffect } from 'react'
import { useScreenCapture } from '@uppy/react'
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
