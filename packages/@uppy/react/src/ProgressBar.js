import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'
import ProgressBarPlugin from '@uppy/progress-bar'
import { uppy as uppyPropType } from './propTypes.js'
import getHTMLProps from './getHTMLProps.js'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.js'

/**
 * React component that renders a progress bar at the top of the page.
 */

class ProgressBar extends Component {
  componentDidMount () {
    this.installPlugin()
  }

  componentDidUpdate (prevProps) {
    // eslint-disable-next-line react/destructuring-assignment
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
      const options = { ...this.props, target: this.container }
      delete options.uppy
      this.plugin.setOptions(options)
    }
  }

  componentWillUnmount () {
    this.uninstallPlugin()
  }

  installPlugin () {
    const { uppy, fixed, hideAfterFinish } = this.props
    const options = {
      id: 'react:ProgressBar',
      fixed,
      hideAfterFinish,
      target: this.container,
    }
    delete options.uppy

    uppy.use(ProgressBarPlugin, options)

    this.plugin = uppy.getPlugin(options.id)
  }

  uninstallPlugin (props = this.props) {
    const { uppy } = props

    uppy.removePlugin(this.plugin)
  }

  render () {
    return h('div', {
      className: 'uppy-Container',
      ref: (container) => {
        this.container = container
      },
      ...getHTMLProps(this.props),
    })
  }
}

ProgressBar.propTypes = {
  uppy: uppyPropType.isRequired,
  fixed: PropTypes.bool,
  hideAfterFinish: PropTypes.bool,
}
// Must be kept in sync with @uppy/progress-bar/src/ProgressBar.jsx
ProgressBar.defaultProps = {
  fixed: false,
  hideAfterFinish: true,
}

export default ProgressBar
