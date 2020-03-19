const { h } = require('preact')

module.exports = ({ currentDeviceId, videoSources, onChangeVideoSource }) => {
  return (
    <p className="uppy-Webcam-videoSource">Video source:
      <select
        className="uppy-Webcam-videoSource-select"
        onchange={(event) => { onChangeVideoSource(event.target.value) }}
      >
        {videoSources.map((videoSource) =>
          <option
            key={videoSource.deviceId}
            value={videoSource.deviceId}
            selected={videoSource.deviceId === currentDeviceId}
          >
            {videoSource.label}
          </option>)}
      </select>
    </p>
  )
}
