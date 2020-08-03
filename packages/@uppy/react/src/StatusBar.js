const React = require('react')
const PropTypes = require('prop-types')
const StatusBarPlugin = require('@uppy/status-bar')
const uppyPropType = require('./propTypes').uppy
const getHTMLProps = require('./getHTMLProps')

const h = React.createElement

/**
 * React component that renders a status bar containing upload progress and speed,
 * processing progress and pause/resume/cancel controls.
 */

class StatusBar extends React.Component {
  constructor (props) {
    super(props)
    this.validProps = getHTMLProps(props)
  }

  componentDidMount () {
    this.installPlugin()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    }
  }

  componentWillUnmount () {
    this.uninstallPlugin()
  }

  installPlugin () {
    const { uppy } = this.props
    const options = {
      id: 'react:StatusBar',
      ...this.props,
      target: this.container,
    }
    delete options.uppy

    uppy.use(StatusBarPlugin, options)

    this.plugin = uppy.getPlugin(options.id)
  }

  uninstallPlugin (props = this.props) {
    const { uppy } = props

    uppy.removePlugin(this.plugin)
  }

  render () {
    return h('div', {
      ref: (container) => {
        this.container = container
      },
      ...this.validProps,
    })
  }
}

StatusBar.propTypes = {
  uppy: uppyPropType,
  hideAfterFinish: PropTypes.bool,
  showProgressDetails: PropTypes.bool,
}
StatusBar.defaultProps = {
}

module.exports = StatusBar
