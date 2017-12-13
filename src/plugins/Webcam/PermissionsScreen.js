const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h)

module.exports = (props) => {
  return html`
    <div class="uppy-Webcam-permissons">
      <h1>Please allow access to your camera</h1>
      <p>You have been prompted to allow camera access from this site.<br>
      In order to take pictures with your camera you must approve this request.</p>
    </div>
  `
}
