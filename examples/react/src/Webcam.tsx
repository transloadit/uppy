import { useWebcam } from '@uppy/react'
import { useEffect } from 'react'
import MediaCapture from './MediaCapture.tsx'

export interface WebcamProps {
  close: () => void
}

export function Webcam({ close }: WebcamProps) {
  const {
    start,
    stop,
    getVideoProps,
    getSnapshotButtonProps,
    getRecordButtonProps,
    getStopRecordingButtonProps,
    getSubmitButtonProps,
    getDiscardButtonProps,
    state,
  } = useWebcam({ onSubmit: close })

  useEffect(() => {
    start()
    return () => {
      stop()
    }
  }, [start, stop])

  return (
    <MediaCapture
      title="Camera"
      close={close}
      getVideoProps={getVideoProps}
      mediaError={state.cameraError}
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
