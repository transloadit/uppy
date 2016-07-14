import Plugin from './Plugin'
import yo from 'yo-yo'

/**
 * Webcam
 *
 */
export default class Webcam extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'Webcam'
    this.title = 'Webcam'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.render = this.render.bind(this)
    this.install = this.install.bind(this)

    this.renderPlayer = this.renderPlayer.bind(this)

    this.startWebcam = this.startWebcam.bind(this)
    this.gotStream = this.gotStream.bind(this)
    this.noStream = this.noStream.bind(this)
    this.stop = this.stop.bind(this)
    this.snapshot = this.snapshot.bind(this)
  }

  render (state) {
    return this.renderPlayer(state.webcam)
  }

  renderSelection (state) {
    return yo`
      <div>
        <button>Video</button>
        <button>Screenshot</button>
      </div>
    `
  }

  renderPlayer (state) {
    return yo`
      <div>
        <video id='UppyWebcam-video' autoplay></video>
        <canvas id='UppyWebcam-canvas'></canvas>
        <button
          class='UppyWebcam-startBtn'
          onclick=${this.startWebcam()}
          disabled=${state.running}>
          Start
        </button>
        <button
          class='UppyWebcam-stopBtn'
          onclick=${this.stop()}
          disabled=${!state.running}>Stop</button>
        <button
          class='UppyWebcam-snapshotBtn'
          onclick=${this.snapshot()}
          disabled=${!state.running}>Snapshot</button>
      </div>
    `
  }

  focus () {
    const firstInput = document.querySelector(`${this.target} .UppyDummy-firstInput`)

    // only works for the first time if wrapped in setTimeout for some reason
    // firstInput.focus()
    setTimeout(function () {
      firstInput.focus()
    }, 10)
  }

  noStream () {
    log('Access to camera was denied!')
  }

  gotStream (stream) {
    const video = this.video

    var myButton = document.getElementById('buttonStart')
    if (myButton) {
      myButton.disabled = true
    }

    this.videoStream = stream

    log('Got stream.')

    video.onerror = function () {
      log('video.onerror')
      if (video) {
        this.stop()
      }
    }

    stream.onended = this.noStream

    if (window.webkitURL) {
      video.src = window.webkitURL.createObjectURL(stream)
    } else if (video.mozSrcObject !== undefined) {
      video.mozSrcObject = stream
      video.play()
    } else if (navigator.mozGetUserMedia) {
      video.src = stream
      video.play()
    } else if (window.URL) {
      video.src = window.URL.createObjectURL(stream)
    } else {
      video.src = stream
    }

    myButton = document.getElementById('buttonSnap')
    if (myButton) {
      myButton.disabled = false
    }

    myButton = document.getElementById('buttonStop')
    if (myButton) {
      myButton.disabled = false
    }
  }

  stop () {
    let { video, videoStream } = this

    var myButton = document.getElementById('buttonStop')

    if (myButton) {
      myButton.disabled = true
    }

    myButton = document.getElementById('buttonSnap')

    if (myButton) {
      myButton.disabled = true
    }

    if (videoStream) {
      if (videoStream.stop) {
        videoStream.stop()
      } else if (videoStream.msStop) {
        videoStream.msStop()
      }

      videoStream.onended = null
      videoStream = null
    }

    if (video) {
      video.onerror = null
      video.pause()

      if (video.mozSrcObject) {
        video.mozSrcObject = null
      }

      video.src = ''
    }

    myButton = document.getElementById('buttonStart')

    if (myButton) {
      myButton.disabled = false
    }
  }

  snapshot () {
    const { video, canvas } = this

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
  }

  startWebcam () {
    this.video = document.getElementById('UppyWebcam-video')
    this.canvas = document.getElementById('UppyWebcam-canvas')

    const { gotStream, noStream } = this

    if ((typeof window === 'undefined') || (typeof navigator === 'undefined')) {
      log('This page needs a Web browser with the objects window.* and navigator.*!')
    } else if (!(this.video && this.canvas)) {
      log('HTML context error!')
    } else {
      log('Get user media…')
      if (navigator.getUserMedia) navigator.getUserMedia({ video: true }, gotStream, noStream)
      else if (navigator.oGetUserMedia) navigator.oGetUserMedia({ video: true }, gotStream, noStream)
      else if (navigator.mozGetUserMedia) navigator.mozGetUserMedia({ video: true }, gotStream, noStream)
      else if (navigator.webkitGetUserMedia) navigator.webkitGetUserMedia({ video: true }, gotStream, noStream)
      else if (navigator.msGetUserMedia) navigator.msGetUserMedia({ video: true, audio: false }, gotStream, noStream)
      else log('getUserMedia() not available from your Web browser!')
    }
  }

  install () {
    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)

    this.startWebcam()
  }
}

function log (text) {
  console.log(text)
}
