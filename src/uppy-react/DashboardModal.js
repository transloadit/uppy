const React = require('react')
const UppyCore = require('../core/Core').Uppy
const ReactDashboardPlugin = require('./bridge/ReactDashboardPlugin')

const h = React.createElement

class Dashboard extends React.Component {
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

Dashboard.propTypes = {
  uppy: React.PropTypes.instanceOf(UppyCore).isRequired,
  onRequestClose: React.PropTypes.func
}

module.exports = Dashboard
