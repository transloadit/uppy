import Plugin from './Plugin'
import yo from 'yo-yo'

/**
 * Webcam
 */
export default class Webcam extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'Webcam'
    this.title = 'Webcam'
    this.icon = yo`
      <svg class="UppyIcon UppyModalTab-icon" width="22" height="28" viewBox="0 0 80 100">
        <path d="M50 19.7c1.819 0 3.3-1.48 3.3-3.3s-1.48-3.3-3.3-3.3-3.3 1.48-3.3 3.3 1.481 3.3 3.3 3.3zM50 53.3c7.995 0 14.5-6.504 14.5-14.499s-6.505-14.5-14.5-14.5-14.5 6.505-14.5 14.5S42.005 53.3 50 53.3zm0-25.199c5.9 0 10.699 4.8 10.699 10.7S55.9 49.501 50 49.501c-5.9 0-10.7-4.8-10.7-10.7s4.8-10.7 10.7-10.7z"/>
        <path d="M50 4.7c-18.803 0-34.1 15.298-34.1 34.101 0 9.002 3.479 17.469 9.8 23.865V86.4c0 4.907 3.993 8.899 8.9 8.899h30.8c4.906 0 8.899-3.992 8.899-8.899V62.666c6.321-6.396 9.8-14.863 9.8-23.865C84.1 19.998 68.803 4.7 50 4.7zm0 3.8c16.707 0 30.3 13.593 30.3 30.301 0 16.707-13.593 30.3-30.3 30.3-16.708 0-30.3-13.593-30.3-30.3C19.7 22.093 33.292 8.5 50 8.5zm15.4 83.001H34.6c-2.812 0-5.1-2.288-5.1-5.101V66.058c.99.796 2.062 1.52 3.2 2.158V88.3h34.6V68.202c1.062-.649 2.135-1.386 3.2-2.197V86.4c0 2.813-2.288 5.101-5.1 5.101zm-1.9-7h-27V70.233C40.566 72.004 45.104 72.9 50 72.9c4.773 0 9.311-.899 13.5-2.676v14.277z"/>
        <path d="M50 47.7c4.907 0 8.9-3.992 8.9-8.899s-3.993-8.9-8.9-8.9-8.9 3.993-8.9 8.9S45.093 47.7 50 47.7zm0-14c2.812 0 5.1 2.288 5.1 5.101 0 2.812-2.287 5.1-5.1 5.1-2.812 0-5.1-2.288-5.1-5.1 0-2.813 2.288-5.101 5.1-5.101z"/>
      </svg>
    `

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.install = this.install.bind(this)
    this.updateState = this.updateState.bind(this)

    this.render = this.render.bind(this)
    this.renderRecordButton = this.renderRecordButton.bind(this)


    // Camera controls
    this.startWebcam = this.startWebcam.bind(this)
    this.stopWebcam = this.stopWebcam.bind(this)
    this.startRecording = this.startRecording.bind(this)
    this.stopRecording = this.stopRecording.bind(this)
    this.takeSnapshot = this.takeSnapshot.bind(this)

    // Stream getting callbacks
    this.onGotStream = this.onGotStream.bind(this)
    this.onNoStream = this.onNoStream.bind(this)
  }

  /**
   * Checks browser support for getting user media,
   * then initializes a new media capture.
   */
  startWebcam () {
    this.video = document.querySelector('.UppyWebcam-video')
    this.canvas = document.querySelector('.UppyWebcam-canvas')

    const { onGotStream, onNoStream } = this

    if ((typeof window === 'undefined') || (typeof navigator === 'undefined')) {
      console.log('This page needs a Web browser with the objects window.* and navigator.*!')
    } else if (!(this.video && this.canvas)) {
      console.log('HTML context error!')
    } else {
      console.log('Get user media…')
      if (navigator.getUserMedia) navigator.getUserMedia({ video: true }, onGotStream, onNoStream)
      else if (navigator.oGetUserMedia) navigator.oGetUserMedia({ video: true }, onGotStream, onNoStream)
      else if (navigator.mozGetUserMedia) navigator.mozGetUserMedia({ video: true }, onGotStream, onNoStream)
      else if (navigator.webkitGetUserMedia) navigator.webkitGetUserMedia({ video: true }, onGotStream, onNoStream)
      else if (navigator.msGetUserMedia) navigator.msGetUserMedia({ video: true, audio: false }, onGotStream, onNoStream)
      else console.log('getUserMedia() not available from your Web browser!')
    }
  }

  /**
   * Stops the webcam capture and video playback.
   */
  stopWebcam () {
    let { video, videoStream } = this

    this.updateState({
      running: false
    })

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

    this.video = document.querySelector('.UppyWebcam-video')
    this.canvas = document.querySelector('.UppyWebcam-canvas')
  }

  /**
   * When `startWebcam` successfully captures media,
   * this callback sets up video playback in the DOM.
   *
   * @param  {MediaStream} stream user media stream
   */
  onGotStream (stream) {
    this.updateState({
      running: true
    })
    this.videoStream = stream
    this.mediaRecorder = new window.MediaRecorder(stream)

    const video = this.video

    console.log('Got stream.')

    video.onerror = () => {
      console.log('video.onerror')
      if (video) {
        this.stopWebcam()
      }
    }

    stream.onended = this.onNoStream

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

    this.video = document.querySelector('.UppyWebcam-video')
    this.canvas = document.querySelector('.UppyWebcam-canvas')
  }

  /**
   * Error callback when capturing user media fails.
   */
  onNoStream () {
    console.log('Access to camera was denied!')
  }

  /**
   * Begins recording the webcam stream and handles the media
   * after recording ends.
   */
  startRecording () {
    if (!this.videoStream) {
      console.log('Error: no video stream available')
      return
    }

    if (!this.mediaRecorder) {
      this.mediaRecorder = new window.MediaRecorder(this.videoStream)
    }

    let chunks = []

    this.mediaRecorder.onstop = (e) => {
      var blob = new Blob(chunks, {type: 'video/webm'})
      chunks = []
      const clip = window.URL.createObjectURL(blob)
      this.video.src = clip
    }

    this.mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data)
    }

    this.mediaRecorder.start()

    this.updateState({
      recording: true
    })

    console.log(this.mediaRecorder.state)
    console.log('recorder started')
  }

  /**
   * Ends media recording
   */
  stopRecording () {
    if (!this.mediaRecorder) {
      console.log('no media recorder exists')
      return
    }

    this.updateState({
      recording: false
    })

    this.mediaRecorder.stop()
  }

  /**
   * Takes a snapshot and displays it in a canvas.
   */
  takeSnapshot () {
    const { video, canvas } = this

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
  }

  render (state) {
    // if (!state.captureMethod) {
    //   return this.renderMenu(state.webcam)
    // }

    return this.renderPlayer(state.webcam)
  }

  renderMenu (state) {
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
        <video class='UppyWebcam-video' autoplay></video>
        <canvas class='UppyWebcam-canvas'></canvas>
        ${this.renderRecordButton(state)}
        <button
          class='UppyWebcam-startBtn'
          onclick=${this.startWebcam}
          disabled=${state.running}>
          Start
        </button>
        <button
          class='UppyWebcam-stopBtn'
          onclick=${this.stopWebcam}
          disabled=${!state.running && !state.recording}>Stop</button>
        <button
          class='UppyWebcam-snapshotBtn'
          onclick=${this.takeSnapshot}
          disabled=${!state.running}>Snapshot</button>
      </div>
    `
  }

  renderRecordButton (state) {
    if (!state.recording) {
      return yo`
        <button
          class='UppyWebcam-recordBtn'
          onclick=${this.startRecording}
          disabled=${!state.running}>
          Start Recording
        </button>
      `
    }

    return yo`
      <button
        class='UppyWebcam-stopRecordBtn'
        onclick=${this.stopRecording}
        disabled=${!state.running && !state.recording}>
        Stop Recording
      </button>
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

  install () {
    this.core.setState({
      webcam: {
        running: false
      }
    })

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)

    this.startWebcam()
  }

  /**
   * Little shorthand to update the state with my new state
   */
  updateState (newState) {
    const {state} = this.core
    const webcam = Object.assign({}, state.webcam, newState)

    this.core.setState({webcam})
  }
}
