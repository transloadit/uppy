const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core').Uppy
const StatusBarPlugin = require('../plugins/StatusBar')

const h = React.createElement

/**
 * React component that renders a status bar containing upload progress and speed,
 * processing progress and pause/resume/cancel controls.
 */

class StatusBar extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    const options = Object.assign(
      {},
      this.props,
      { target: this.container }
    )
    delete options.uppy

    uppy.use(StatusBarPlugin, options)

    this.plugin = uppy.getPlugin('StatusBar')
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

StatusBar.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired
}
StatusBar.defaultProps = {
}

module.exports = StatusBar
