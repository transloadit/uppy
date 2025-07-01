import type {
  Body,
  DefinePluginOpts,
  Meta,
  State,
  UIPluginOptions,
  Uppy,
} from '@uppy/core'
import { UIPlugin } from '@uppy/core'
import { type ComponentChild, h } from 'preact'

import packageJson from '../package.json' with { type: 'json' }

export interface ProgressBarOptions extends UIPluginOptions {
  hideAfterFinish?: boolean
  fixed?: boolean
}
// set default options, must kept in sync with @uppy/react/src/ProgressBar.js
const defaultOptions = {
  fixed: false,
  hideAfterFinish: true,
}

type Opts = DefinePluginOpts<ProgressBarOptions, keyof typeof defaultOptions>

/**
 * Progress bar
 *
 */
export default class ProgressBar<
  M extends Meta,
  B extends Body,
> extends UIPlugin<Opts, M, B> {
  static VERSION = packageJson.version

  constructor(uppy: Uppy<M, B>, opts?: ProgressBarOptions) {
    super(uppy, { ...defaultOptions, ...opts })
    this.id = this.opts.id || 'ProgressBar'
    this.title = 'Progress Bar'
    this.type = 'progressindicator'

    this.render = this.render.bind(this)
  }

  render(state: State<M, B>): ComponentChild {
    const { totalProgress } = state
    // before starting and after finish should be hidden if specified in the options
    const isHidden =
      (totalProgress === 0 || totalProgress === 100) &&
      this.opts.hideAfterFinish
    return (
      <div
        className="uppy uppy-ProgressBar"
        style={{ position: this.opts.fixed ? 'fixed' : 'initial' }}
        aria-hidden={isHidden}
      >
        <div
          className="uppy-ProgressBar-inner"
          style={{ width: `${totalProgress}%` }}
        />
        <div className="uppy-ProgressBar-percentage">{totalProgress}</div>
      </div>
    )
  }

  install(): void {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall(): void {
    this.unmount()
  }
}
