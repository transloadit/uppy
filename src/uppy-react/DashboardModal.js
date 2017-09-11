const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core/Core')
const UppyWrapper = require('./Wrapper')

const h = React.createElement

/**
 * React Component that renders a Dashboard for an Uppy instance in a Modal
 * dialog. Visibility of the Modal is toggled using the `open` prop.
 */

class DashboardModal extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy

    this.plugin = uppy.getPlugin(this.props.plugin)
    if (this.props.open) {
      this.plugin.showModal()
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.open && !nextProps.open) {
      this.plugin.hideModal()
    } else if (!this.props.open && nextProps.open) {
      this.plugin.showModal()
    }
  }

  render () {
    return h(UppyWrapper, this.props)
  }
}

DashboardModal.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  open: PropTypes.bool,
  onRequestClose: PropTypes.func
}

DashboardModal.defaultProps = {
  plugin: 'DashboardUI'
}

module.exports = DashboardModal
