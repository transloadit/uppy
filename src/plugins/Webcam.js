import Plugin from './Plugin'
import html from '../core/html'
import {dataURItoFile} from '../core/Utils'

/**
 * Webcam
 */
export default class Webcam extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'Webcam'
    this.title = 'Webcam'
    this.icon = html`
      <svg class="UppyIcon UppyModalTab-icon" width="18" height="21" viewBox="0 0 18 21">
        <g>
          <path d="M14.8 16.9c1.9-1.7 3.2-4.1 3.2-6.9 0-5-4-9-9-9s-9 4-9 9c0 2.8 1.2 5.2 3.2 6.9C1.9 17.9.5 19.4 0 21h3c1-1.9 11-1.9 12 0h3c-.5-1.6-1.9-3.1-3.2-4.1zM9 4c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6z"/>
          <path d="M9 14c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zM8 8c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1c0-.5.4-1 1-1z"/>
        </g>
      </svg>
    `

    this.snapshotIcon = html`
      <svg class="UppyIcon" width="37" height="33" viewBox="0 0 100 96.25">
        <path d="M50 32c-7.168 0-13 5.832-13 13s5.832 13 13 13 13-5.832 13-13-5.832-13-13-13z"/>
        <path d="M87 13H72c0-7.18-5.82-13-13-13H41c-7.18 0-13 5.82-13 13H13C5.82 13 0 18.82 0 26v38c0 7.18 5.82 13 13 13h74c7.18 0 13-5.82 13-13V26c0-7.18-5.82-13-13-13zM50 68c-12.683 0-23-10.318-23-23s10.317-23 23-23 23 10.318 23 23-10.317 23-23 23z"/>
      </svg>
    `

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.install = this.install.bind(this)
    this.updateState = this.updateState.bind(this)

    this.render = this.render.bind(this)

    // Camera controls
    this.startWebcam = this.startWebcam.bind(this)
    this.stopWebcam = this.stopWebcam.bind(this)
    this.startRecording = this.startRecording.bind(this)
    this.stopRecording = this.stopRecording.bind(this)
    this.takeSnapshot = this.takeSnapshot.bind(this)
    this.generateImage = this.generateImage.bind(this)

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
      cameraReady: false
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
    console.log('Got stream!')
    this.updateState({
      cameraReady: true
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
  generateImage (video, canvas, opts) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    var dataUrl = canvas.toDataURL(opts.mimeType)

    var file = dataURItoFile(dataUrl, {
      name: opts.name
    })

    return {
      dataUrl: dataUrl,
      data: file,
      type: opts.mimeType
    }
  }

  takeSnapshot () {
    const {video, canvas, generateImage} = this
    const opts = {
      name: `webcam-${Date.now()}.jpg`,
      mimeType: 'image/jpeg'
    }

    var image = generateImage(video, canvas, opts)

    const tagFile = {
      source: this.id,
      name: opts.name,
      data: image.data,
      type: opts.type
    }

    this.core.emitter.emit('file-add', tagFile)
  }

  render (state) {
    console.log('RENDER METHOD')
    // if (!state.webcam.cameraReady) {
    //   return this.renderMenu(state.webcam)
    // }

    return this.renderPlayer(state.webcam)
  }

  renderMenu (state) {
    return html`
      <div>
        <h1>Please allow access to your camera</h1>
        <span>You have been prompted to allow camera access from this site. In order to take pictures with your camera you must approve this request.</span>
      </div>
    `
  }

  renderPlayer (state) {
    return html`
      <div>
        <div class='UppyWebcam-videoContainer'>
          <video class='UppyWebcam-video' autoplay></video>
        </div>
        <div class='UppyWebcam-buttonContainer'>
          <button class="UppyButton--circular UppyButton--blue UppyButton--sizeM UppyDashboard-upload"
            type="button"
            title="Take a snapshot"
            aria-label="Take a snapshot"
            onclick=${this.takeSnapshot}>
            ${this.snapshotIcon}
          </button>
        </div>
        <canvas class='UppyWebcam-canvas'></canvas>
      </div>
    `
  }

  // renderRecordButton (state) {
  //   if (!state.recording) {
  //     return html`
  //       <button
  //         class='UppyWebcam-recordBtn'
  //         onclick=${this.startRecording}
  //         disabled=${!state.running}>
  //         Start Recording
  //       </button>
  //     `
  //   }

  //   return html`
  //     <button
  //       class='UppyWebcam-stopRecordBtn'
  //       onclick=${this.stopRecording}
  //       disabled=${!state.running && !state.recording}>
  //       Stop Recording
  //     </button>
  //   `
  // }

  focus () {
    const firstInput = document.querySelector(`${this.target} .UppyDummy-firstInput`)
    console.log('focus')
    // only works for the first time if wrapped in setTimeout for some reason
    // firstInput.focus()
    setTimeout(function () {
      firstInput.focus()
    }, 10)

    this.startWebcam()
  }

  install () {
    this.core.setState({
      webcam: {
        cameraReady: false
      }
    })

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
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
