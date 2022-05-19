const React = require('react')
const DragDropPlugin = require('@uppy/drag-drop')
const propTypes = require('./propTypes')
const getHTMLProps = require('./getHTMLProps')
const nonHtmlPropsHaveChanged = require('./nonHtmlPropsHaveChanged')

const h = React.createElement

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

class DragDrop extends React.Component {
  componentDidMount () {
    this.installPlugin()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    } else if (nonHtmlPropsHaveChanged(this, prevProps)) {
      const options = { ...this.props, target: this.container }
      delete options.uppy
      this.plugin.setOptions(options)
    }
  }

  componentWillUnmount () {
    this.uninstallPlugin()
  }

  installPlugin () {
    const { uppy } = this.props
    const options = {
      id: 'react:DragDrop',
      ...this.props,
      target: this.container,
    }
    delete options.uppy

    uppy.use(DragDropPlugin, options)

    this.plugin = uppy.getPlugin(options.id)
  }

  uninstallPlugin (props = this.props) {
    const { uppy } = props

    uppy.removePlugin(this.plugin)
  }

  render () {
    // TODO: stop exposing `validProps` as a public property and rename it to `htmlProps`
    this.validProps = getHTMLProps(this.props)
    return h('div', {
      className: 'uppy-Container',
      ref: (container) => {
        this.container = container
      },
      ...this.validProps,
    })
  }
}

DragDrop.propTypes = {
  uppy: propTypes.uppy,
  locale: propTypes.locale,
}
DragDrop.defaultProps = {
}

module.exports = DragDrop
