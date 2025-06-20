/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/react-in-jsx-scope */
import React, { useEffect } from 'react'
import { useWebcam } from '@uppy/react'
import MediaCapture from './MediaCapture.tsx'

export interface WebcamProps {
  isOpen: boolean
  close: () => void
}

export function Webcam({ isOpen, close }: WebcamProps) {
  const {
    start,
    stop,
    getVideoProps,
    getSnapshotButtonProps,
    getRecordButtonProps,
    getStopRecordingButtonProps,
    getSubmitButtonProps,
    getDiscardButtonProps,
  } = useWebcam({ onSubmit: close })

  useEffect(() => {
    if (isOpen) {
      start()
    }
    return () => {
      stop()
    }
  }, [start, stop, isOpen])

  return (
    <MediaCapture
      title="Camera"
      close={close}
      getVideoProps={getVideoProps}
      getPrimaryActionButtonProps={getSnapshotButtonProps}
      primaryActionButtonLabel="Snapshot"
      getRecordButtonProps={getRecordButtonProps}
      getStopRecordingButtonProps={getStopRecordingButtonProps}
      getSubmitButtonProps={getSubmitButtonProps}
      getDiscardButtonProps={getDiscardButtonProps}
    />
  )
}

export default Webcam
