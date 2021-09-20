/* eslint-disable jsx-a11y/no-noninteractive-element-interactions  */
/* eslint-disable jsx-a11y/click-events-have-key-events */
const { h } = require('preact')
const { UIPlugin } = require('@uppy/core')
const FadeIn = require('./FadeIn')
const TransitionGroup = require('./TransitionGroup')

/**
 * Informer
 * Shows rad message bubbles
 * used like this: `uppy.info('hello world', 'info', 5000)`
 * or for errors: `uppy.info('Error uploading img.jpg', 'error', 5000)`
 *
 */
module.exports = class Informer extends UIPlugin {
  // eslint-disable-next-line global-require
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'progressindicator'
    this.id = this.opts.id || 'Informer'
    this.title = 'Informer'

    // set default options
    const defaultOptions = {}
    // merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }
  }

  render = (state) => {
    return (
      <div className="uppy uppy-Informer">
        <TransitionGroup>
          {state.info.map((info) => (
            <FadeIn key={info.message}>
              <p role="alert">
                {info.message}
                {' '}
                {info.details && (
                  <span
                    aria-label={info.details}
                    data-microtip-position="top-left"
                    data-microtip-size="medium"
                    role="tooltip"
                    // eslint-disable-next-line no-alert
                    onClick={() => alert(`${info.message} \n\n ${info.details}`)}
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

  install () {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }
}
