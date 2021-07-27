const React = require('react')
const PropTypes = require('prop-types')
const DashboardPlugin = require('@uppy/dashboard')
const basePropTypes = require('./propTypes').dashboard
const getHTMLProps = require('./getHTMLProps')

const h = React.createElement

/**
 * React Component that renders a Dashboard for an Uppy instance in a Modal
 * dialog. Visibility of the Modal is toggled using the `open` prop.
 */

class DashboardModal extends React.Component {
  constructor (props) {
    super(props)
    this.validProps = getHTMLProps(props)
  }

  componentDidMount () {
    this.installPlugin()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    }
    if (prevProps.open && !this.props.open) {
      this.plugin.closeModal()
    } else if (!prevProps.open && this.props.open) {
      this.plugin.openModal()
    }
  }

  componentWillUnmount () {
    this.uninstallPlugin()
  }

  installPlugin () {
    const { uppy } = this.props
    const options = {
      id: 'react:DashboardModal',
      ...this.props,
      onRequestCloseModal: this.props.onRequestClose,
    }

    if (!options.target) {
      options.target = this.container
    }

    delete options.uppy
    uppy.use(DashboardPlugin, options)

    this.plugin = uppy.getPlugin(options.id)
    if (this.props.open) {
      this.plugin.openModal()
    }
  }

  uninstallPlugin (props = this.props) {
    const { uppy } = props

    uppy.removePlugin(this.plugin)
  }

  render () {
    return h('div', {
      ref: (container) => {
        this.container = container
      },
      ...this.validProps,
    })
  }
}

DashboardModal.propTypes = { // Only check this prop type in the browser.
  target: typeof window !== 'undefined' ? PropTypes.instanceOf(window.HTMLElement) : PropTypes.any,
  open: PropTypes.bool,
  onRequestClose: PropTypes.func,
  closeModalOnClickOutside: PropTypes.bool,
  disablePageScrollWhenModalOpen: PropTypes.bool,
  ...basePropTypes,
}

DashboardModal.defaultProps = {
}

module.exports = DashboardModal
