const PropTypes = require('prop-types')
const React = require('react')
const FileInputPlugin = require('@uppy/file-input')
const propTypes = require('./propTypes')

const h = React.createElement

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

class FileInput extends React.Component {
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
    const uppy = this.props.uppy
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
    const uppy = props.uppy

    uppy.removePlugin(this.plugin)
  }

  render () {
    return h('div', {
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

module.exports = FileInput
