const { h } = require('preact')

module.exports = (props) => {
  return (
    <div class="uppy-Webcam-permissons">
      <div class="uppy-Webcam-permissonsIcon">{props.icon()}</div>
      <h1 class="uppy-Webcam-Title">Please allow access to your camera</h1>
      <p>You have been prompted to allow camera access from this site.<br />
      In order to take pictures with your camera you must approve this request.</p>
    </div>
  )
}
