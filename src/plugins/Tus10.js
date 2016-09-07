import Plugin from './Plugin'
import { Tus10 as Uploader } from 'uppy-base'

/**
 * Tus resumable file uploader
 *
 */
export default class Tus10 extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'
    this.id = 'Tus'
    this.title = 'Tus'

    // set default options
    const defaultOptions = {
      resume: true,
      allowPause: true
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.uploader = new Uploader(this.opts)
  }

  start (files) {
    this.uploader.start(files)
  }

  actions () {
    this.core.emitter.on('core:pause-all', () => {
      this.uploader.pauseResume('pauseAll')
    })

    this.core.emitter.on('core:resume-all', () => {
      this.uploader.pauseResume('resumeAll')
    })
  }

  install () {
    this.actions()

    const bus = this.core.emitter
    bus.on('core:upload', () => {
      this.core.log('Tus is uploading...')

      const files = this.core.getState().files
      this.uploader.selectForUpload(files)
    })
  }
}
