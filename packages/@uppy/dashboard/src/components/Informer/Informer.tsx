import type { Body, Meta, State, UIPluginOptions, Uppy } from '@uppy/core'
import { Component, type ComponentChild, h } from 'preact'
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
type InformerProps = {
  uppy: Uppy<any, any>
}

export default class Informer extends Component<InformerProps> {
  render(): ComponentChild {
    // Get info from the uppy instance passed in props
    const { info } = this.props.uppy.getState()

    return (
      <div className="uppy uppy-Informer">
        <TransitionGroup>
          {info.map((info) => (
            <FadeIn key={info.message}>
              <p role="alert">
                {info.message}{' '}
                {info.details && (
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
}
