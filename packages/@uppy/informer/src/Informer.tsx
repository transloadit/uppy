/* eslint-disable jsx-a11y/no-noninteractive-element-interactions  */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { h, type ComponentChild } from 'preact'
import { UIPlugin } from '@uppy/core'
import type { State, UIPluginOptions, Uppy, Body, Meta } from '@uppy/core'
import FadeIn from './FadeIn.js'
import TransitionGroup from './TransitionGroup.js'

import packageJson from '../package.json' with { type: 'json' }

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
                  <span
                    // TODO: fix this type
                    aria-label={info.details as string}
                    data-microtip-position="top-left"
                    data-microtip-size="medium"
                    role="tooltip"
                    onClick={() =>
                      // eslint-disable-next-line no-alert
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
