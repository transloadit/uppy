const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core/Core').Uppy
const DashboardPlugin = require('../plugins/Dashboard')

const h = React.createElement

/**
 * React Component that renders a Dashboard for an Uppy instance in a Modal
 * dialog. Visibility of the Modal is toggled using the `open` prop.
 */

class DashboardModal extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    const options = Object.assign(
      {},
      this.props,
      {
        target: this.container,
        onRequestCloseModal: this.props.onRequestClose
      }
    )
    delete options.uppy
    uppy.use(DashboardPlugin, options)

    this.plugin = uppy.getPlugin('Dashboard')
    if (this.props.open) {
      this.plugin.openModal()
    }
  }

  componentWillUnmount () {
    const uppy = this.props.uppy

    uppy.removePlugin(this.plugin)
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.open && !nextProps.open) {
      this.plugin.closeModal()
    } else if (!this.props.open && nextProps.open) {
      this.plugin.openModal()
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
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  open: PropTypes.bool,
  onRequestClose: PropTypes.func,
  plugins: PropTypes.arrayOf(PropTypes.string),
  maxWidth: PropTypes.number,
  maxHeight: PropTypes.number,
  showProgressDetails: PropTypes.bool,
  hideUploadButton: PropTypes.bool,
  note: PropTypes.string,
  locale: PropTypes.object
}

DashboardModal.defaultProps = {
}

module.exports = DashboardModal
