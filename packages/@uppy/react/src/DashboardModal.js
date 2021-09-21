const React = require('react')
const PropTypes = require('prop-types')
const DashboardPlugin = require('@uppy/dashboard')
const basePropTypes = require('./propTypes').dashboard
const getHTMLProps = require('./getHTMLProps')

const h = React.createElement

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

/**
 * React Component that renders a Dashboard for an Uppy instance in a Modal
 * dialog. Visibility of the Modal is toggled using the `open` prop.
 */

class DashboardModal extends React.Component {
  #nonHtmlPropsHaveChanged = (prevProps) => Object.keys(this.props)
    .some(key => !hasOwn(this.validProps, key) && this.props[key] !== prevProps[key])

  componentDidMount () {
    this.installPlugin()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    } else if (this.#nonHtmlPropsHaveChanged(prevProps)) {
      const options = { ...this.props, onRequestCloseModal: this.props.onRequestClose }
      delete options.uppy
      this.plugin.setOptions(options)
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
    // TODO: rename this.validProps to this.#htmlProps
    this.validProps = getHTMLProps(this.props)
    return h('div', {
      ref: (container) => {
        this.container = container
      },
      ...this.validProps,
    })
  }
}

DashboardModal.propTypes = {
  target: typeof window !== 'undefined' ? PropTypes.instanceOf(window.HTMLElement) : PropTypes.any,
  open: PropTypes.bool,
  onRequestClose: PropTypes.func,
  closeModalOnClickOutside: PropTypes.bool,
  disablePageScrollWhenModalOpen: PropTypes.bool,
  ...basePropTypes,
}

module.exports = DashboardModal
