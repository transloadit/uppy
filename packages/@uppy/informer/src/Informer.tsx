import type { Body, Meta, State, UIPluginOptions, Uppy } from '@uppy/core'
import { UIPlugin } from '@uppy/core'
import { type ComponentChild, h } from 'preact'
import packageJson from '../package.json' with { type: 'json' }
import FadeIn from './FadeIn.js'
import TransitionGroup from './TransitionGroup.js'

export type InformerOptions = UIPluginOptions

/**
 * Informer
 * Shows rad message bubbles
 * used like this: `uppy.info('hello world', 'info', 5000)`
 * or for errors: `uppy.info('Error uploading img.jpg', 'error', 5000)`
 *
 */
export default class Informer<M extends Meta, B extends Body> extends UIPlugin<
  UIPluginOptions,
  M,
  B
> {
  static VERSION = packageJson.version

  constructor(uppy: Uppy<M, B>, opts?: UIPluginOptions) {
    super(uppy, opts)
    this.type = 'progressindicator'
    this.id = this.opts.id || 'Informer'
    this.title = 'Informer'
  }

  render = (state: State<M, B>): ComponentChild => {
    return (
      <div className="uppy uppy-Informer">
        <TransitionGroup>
          {state.info.map((info) => (
            <FadeIn key={info.message}>
              <p role="alert">
                {info.message}{' '}
                {info.details && (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: ...
                  <span
                    aria-label={info.details as string}
                    data-microtip-position="top-left"
                    data-microtip-size="medium"
                    role="tooltip"
                    onClick={() =>
                      alert(`${info.message} \n\n ${info.details}`)
                    }
                  >
                    ?
                  </span>
                )}
              </p>
            </FadeIn>
          ))}
        </TransitionGroup>
      </div>
    )
  }

  install(): void {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }
}
