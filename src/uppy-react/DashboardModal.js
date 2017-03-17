const React = require('react')
const UppyCore = require('../core/Core').Uppy
const ReactDashboardPlugin = require('./bridge/ReactDashboardPlugin')

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
      onRequestClose: this.props.onRequestClose
    })

    this.plugin = uppy.getPlugin('ReactDashboard')
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

  render () {
    return h('div', {
      ref: (container) => {
        this.container = container
      }
    })
  }
}

DashboardModal.propTypes = {
  uppy: React.PropTypes.instanceOf(UppyCore).isRequired,
  onRequestClose: React.PropTypes.func
}

module.exports = DashboardModal
