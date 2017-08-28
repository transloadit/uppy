const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core/Core').Uppy
const ReactDashboardPlugin = require('./bridge/ReactDashboardPlugin')
const StatusBarPlugin = require('../plugins/StatusBar')
const InformerPlugin = require('../plugins/Informer')

const h = React.createElement

/**
 * React Component that renders a Dashboard for an Uppy instance in a Modal
 * dialog. Visibility of the Modal is toggled using the `open` prop.
 */

class DashboardModal extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    uppy.use(ReactDashboardPlugin, {
      target: this.container,
      locale: this.props.locale,
      maxWidth: this.props.maxWidth,
      maxHeight: this.props.maxHeight,
      semiTransparent: this.props.semiTransparent,
      showProgressDetails: this.props.showProgressDetails,
      // TODO Accept a React node here and render it so we can pass a DOM
      // element to this option.
      // defaultTabIcon: this.props.defaultTabIcon,
      onRequestClose: this.props.onRequestClose
    })
    uppy.use(StatusBarPlugin, { target: ReactDashboardPlugin })
    uppy.use(InformerPlugin, { target: ReactDashboardPlugin })

    this.plugin = uppy.getPlugin('ReactDashboard')
    this.statusBar = uppy.getPlugin('StatusBarUI')
    this.informer = uppy.getPlugin('Informer')
    if (this.props.open) {
      this.plugin.showModalInternal()
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.open && !nextProps.open) {
      this.plugin.hideModalInternal()
    } else if (!this.props.open && nextProps.open) {
      this.plugin.showModalInternal()
    }
  }

  componentWillUnmount () {
    const uppy = this.props.uppy

    uppy.removePlugin(this.informer)
    uppy.removePlugin(this.statusBar)
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

DashboardModal.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  maxWidth: PropTypes.number,
  maxHeight: PropTypes.number,
  semiTransparent: PropTypes.bool,
  defaultTabIcon: PropTypes.node,
  showProgressDetails: PropTypes.bool,
  onRequestClose: PropTypes.func,
  locale: PropTypes.object
}

DashboardModal.defaultProps = {
  locale: {}
}

module.exports = DashboardModal
