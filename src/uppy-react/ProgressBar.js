const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core/Core')
const ProgressBarPlugin = require('../plugins/ProgressBar')

const h = React.createElement

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

class ProgressBar extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    const options = Object.assign({}, this.props, {
      target: this.container
    })
    delete options.uppy
    uppy.use(ProgressBarPlugin, options)
  }

  render () {
    return h('div', {
      ref: (container) => {
        this.container = container
      }
    })
  }
}

ProgressBar.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  locale: PropTypes.object
}

ProgressBar.defaultProps = {
  locale: {}
}

module.exports = ProgressBar
