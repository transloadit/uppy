import { h, type ComponentChild } from 'preact'
import { UIPlugin, Uppy, type UIPluginOptions } from '@uppy/core'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'


interface ProgressBarOptions extends UIPluginOptions {
  target?: HTMLElement | string
  hideAfterFinish?: boolean,
  fixed?: boolean,
}
interface ProgressBarState {
  audioReady: boolean
  recordingLengthSeconds: number
  hasAudio: boolean
  cameraError: null
  audioSources: MediaDeviceInfo[]
  currentDeviceId?: null | string | MediaStreamTrack
  isRecording: boolean
  showAudioSourceDropdown: boolean
  [id: string]: unknown
}

/**
 * Progress bar
 *
 */
export default class ProgressBar<M extends Meta, B extends Body>
  extends UIPlugin<ProgressBarOptions, M, B, ProgressBarState> {
  static VERSION = packageJson.version

  constructor (uppy: Uppy<M, B>, opts?: ProgressBarOptions) {
    super(uppy, opts)
    this.id = this.opts.id || 'ProgressBar'
    this.title = 'Progress Bar'
    this.type = 'progressindicator'

    // set default options, must kept in sync with @uppy/react/src/ProgressBar.js
    const defaultOptions = {
      target: 'body',
      fixed: false,
      hideAfterFinish: true,
    }

    // merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }

    this.render = this.render.bind(this)
  }

  render (state: ProgressBarState): ComponentChild {
    const progress = state.totalProgress || 0
    // before starting and after finish should be hidden if specified in the options
    const isHidden = (progress === 0 || progress === 100) && this.opts.hideAfterFinish
    return (
      <div
        className="uppy uppy-ProgressBar"
        style={{ position: this.opts.fixed ? 'fixed' : 'initial' }}
        aria-hidden={isHidden}
      >
        <div className="uppy-ProgressBar-inner" style={{ width: `${progress}%` }} />
        <div className="uppy-ProgressBar-percentage">{progress}</div>
      </div>
    )
  }

  install (): void {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall (): void {
    this.unmount()
  }
}
