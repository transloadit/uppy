const html = require('yo-yo')

module.exports = (props) => {
  return html`
    <div class="uppy-Webcam-permissons">
      <h1>Please allow access to your camera</h1>
      <p>You have been prompted to allow camera access from this site.<br>
      In order to take pictures with your camera you must approve this request.</p>
    </div>
  `
}
