const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core/Core')
const DashboardPlugin = require('../plugins/Dashboard')
const StatusBarPlugin = require('../plugins/StatusBar')
const InformerPlugin = require('../plugins/Informer')

const h = React.createElement

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline, so you can put it anywhere you want.
 */

class Dashboard extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    const options = Object.assign({}, this.props, {
      target: this.container,
      disableInformer: true,
      disableStatusBar: true,
      inline: true
    })
    delete options.uppy
    uppy.use(DashboardPlugin, options)
    uppy.use(StatusBarPlugin, { target: DashboardPlugin })
    uppy.use(InformerPlugin, { target: DashboardPlugin })

    this.plugin = uppy.getPlugin('DashboardUI')
    this.statusBar = uppy.getPlugin('StatusBarUI')
    this.informer = uppy.getPlugin('Informer')
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

Dashboard.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  maxWidth: PropTypes.number,
  maxHeight: PropTypes.number,
  semiTransparent: PropTypes.bool,
  defaultTabIcon: PropTypes.node,
  showProgressDetails: PropTypes.bool,
  locale: PropTypes.object
}

Dashboard.defaultProps = {
  locale: {}
}

module.exports = Dashboard
