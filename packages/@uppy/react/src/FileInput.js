import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'
import FileInputPlugin from '@uppy/file-input'
import * as propTypes from './propTypes.js'

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

class FileInput extends Component {
  componentDidMount () {
    this.installPlugin()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    }
  }

  componentWillUnmount () {
    this.uninstallPlugin()
  }

  installPlugin () {
    const { uppy } = this.props
    const options = {
      id: 'react:FileInput',
      ...this.props,
      target: this.container,
    }
    delete options.uppy

    uppy.use(FileInputPlugin, options)

    this.plugin = uppy.getPlugin(options.id)
  }

  uninstallPlugin (props = this.props) {
    const { uppy } = props

    uppy.removePlugin(this.plugin)
  }

  render () {
    return h('div', {
      className: 'uppy-Container',
      ref: (container) => {
        this.container = container
      },
    })
  }
}

FileInput.propTypes = {
  uppy: propTypes.uppy,
  locale: propTypes.locale,
  pretty: PropTypes.bool,
  inputName: PropTypes.string,
}
FileInput.defaultProps = {
}

export default FileInput
