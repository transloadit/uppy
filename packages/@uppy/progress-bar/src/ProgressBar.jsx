import { h } from 'preact'
import { UIPlugin } from '@uppy/core'

import packageJson from '../package.json'

/**
 * Progress bar
 *
 */
export default class ProgressBar extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
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

  render (state) {
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

  install () {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.unmount()
  }
}
