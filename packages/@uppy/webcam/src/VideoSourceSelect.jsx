import { h } from 'preact'

export default ({ currentDeviceId, videoSources, onChangeVideoSource }) => {
  return (
    <div className="uppy-Webcam-videoSource">
      <select
        className="uppy-u-reset uppy-Webcam-videoSource-select"
        onChange={(event) => { onChangeVideoSource(event.target.value) }}
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
