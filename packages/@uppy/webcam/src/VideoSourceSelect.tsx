import { h } from 'preact'

interface VideoSourceSelect {
  currentDeviceId: string
  videoSources: boolean[]
  onChangeVideoSource: () => void
}
export default ({
  currentDeviceId,
  videoSources,
  onChangeVideoSource,
}: VideoSourceSelect): JSX.Element => {
  return (
    <div className="uppy-Webcam-videoSource">
      <select
        className="uppy-u-reset uppy-Webcam-videoSource-select"
        onChange={(event) => {
          onChangeVideoSource(event.target.value)
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
