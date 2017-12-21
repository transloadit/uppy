const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core').Uppy
const ProgressBarPlugin = require('../plugins/ProgressBar')

const h = React.createElement

/**
 * React component that renders a progress bar at the top of the page.
 */

class ProgressBar extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    const options = Object.assign(
      {},
      this.props,
      { target: this.container }
    )
    delete options.uppy

    uppy.use(ProgressBarPlugin, options)

    this.plugin = uppy.getPlugin('ProgressBar')
  }

  componentWillUnmount () {
    const uppy = this.props.uppy

    uppy.removePlugin(this.plugin)
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
  fixed: PropTypes.bool
}
ProgressBar.defaultProps = {
}

module.exports = ProgressBar
