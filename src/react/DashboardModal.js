const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core/Core')
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

    this.plugin = uppy.getPlugin(this.props.plugin)
    if (this.props.open) {
      this.plugin.openModal()
    }
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
  width: PropTypes.number,
  height: PropTypes.number,
  semiTransparent: PropTypes.bool,
  showProgressDetails: PropTypes.bool,
  hideUploadButton: PropTypes.bool,
  note: PropTypes.string,
  locale: PropTypes.object
}

DashboardModal.defaultProps = {
}

module.exports = DashboardModal
