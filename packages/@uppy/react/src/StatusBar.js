const React = require('react')
const PropTypes = require('prop-types')
const StatusBarPlugin = require('@uppy/status-bar')
const uppyPropType = require('./propTypes').uppy
const getHTMLProps = require('./getHTMLProps')
const nonHtmlPropsHaveChanged = require('./nonHtmlPropsHaveChanged')

const h = React.createElement

/**
 * React component that renders a status bar containing upload progress and speed,
 * processing progress and pause/resume/cancel controls.
 */

class StatusBar extends React.Component {
  componentDidMount () {
    this.installPlugin()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    } else if (nonHtmlPropsHaveChanged(this, prevProps)) {
      const options = { ...this.props, target: this.container }
      delete options.uppy
      this.plugin.setOptions(options)
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
    // TODO: stop exposing `validProps` as a public property and rename it to `htmlProps`
    this.validProps = getHTMLProps(this.props)
    return h('div', {
      className: 'uppy-Container',
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
