import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'
import { uppy as uppyPropType } from './propTypes.js'

class UppyWrapper extends Component {
  constructor (props) {
    super(props)

    this.refContainer = this.refContainer.bind(this)
  }

  componentDidMount () {
    this.installPlugin()
  }

  componentDidUpdate (prevProps) {
    const { uppy } = this.props
    if (prevProps.uppy !== uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    }
  }

  componentWillUnmount () {
    this.uninstallPlugin()
  }

  installPlugin () {
    const { plugin, uppy } = this.props
    const pluginObj = uppy
      .getPlugin(plugin)

    pluginObj.mount(this.container, pluginObj)
  }

  uninstallPlugin ({ uppy } = this.props) {
    const { plugin } = this.props
    uppy
      .getPlugin(plugin)
      .unmount()
  }

  refContainer (container) {
    this.container = container
  }

  render () {
    return h('div', { className: 'uppy-Container', ref: this.refContainer })
  }
}

UppyWrapper.propTypes = {
  uppy: uppyPropType.isRequired,
  plugin: PropTypes.string.isRequired,
}

export default UppyWrapper
