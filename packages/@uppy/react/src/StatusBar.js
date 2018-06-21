const React = require('react')
const PropTypes = require('prop-types')
const StatusBarPlugin = require('@uppy/status-bar')
const uppyPropType = require('./propTypes').uppy

const h = React.createElement

/**
 * React component that renders a status bar containing upload progress and speed,
 * processing progress and pause/resume/cancel controls.
 */

class StatusBar extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    const options = Object.assign(
      { id: 'react:StatusBar' },
      this.props,
      { target: this.container }
    )
    delete options.uppy

    uppy.use(StatusBarPlugin, options)

    this.plugin = uppy.getPlugin(options.id)
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
  uppy: uppyPropType,
  hideAfterFinish: PropTypes.bool,
  showProgressDetails: PropTypes.bool
}
StatusBar.defaultProps = {
}

module.exports = StatusBar
