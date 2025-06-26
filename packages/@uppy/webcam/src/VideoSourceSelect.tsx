import { type ComponentChild, h } from 'preact'

export interface VideoSourceSelectProps {
  currentDeviceId: string | MediaStreamTrack | null | undefined
  videoSources: MediaDeviceInfo[]
  onChangeVideoSource: (deviceId: string) => void
}
export default function VideoSourceSelect({
  currentDeviceId,
  videoSources,
  onChangeVideoSource,
}: VideoSourceSelectProps): ComponentChild {
  return (
    <div className="uppy-Webcam-videoSource">
      <select
        className="uppy-u-reset uppy-Webcam-videoSource-select"
        onChange={(event) => {
          onChangeVideoSource((event.target as HTMLInputElement).value)
        }}
      >
        {videoSources.map((videoSource) => (
          <option
            key={videoSource.deviceId}
            value={videoSource.deviceId}
            selected={videoSource.deviceId === currentDeviceId}
          >
            {videoSource.label}
          </option>
        ))}
      </select>
    </div>
  )
}
