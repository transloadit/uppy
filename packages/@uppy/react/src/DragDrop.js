import { createElement as h, Component } from 'react'
import PropTypes from 'prop-types'
import DragDropPlugin from '@uppy/drag-drop'
import * as propTypes from './propTypes.js'
import getHTMLProps from './getHTMLProps.js'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.js'

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

class DragDrop extends Component {
  componentDidMount () {
    this.installPlugin()
  }

  componentDidUpdate (prevProps) {
    // eslint-disable-next-line react/destructuring-assignment
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
    const {
      uppy,
      locale,
      inputName,
      width,
      height,
      note,
    } = this.props
    const options = {
      id: 'react:DragDrop',
      locale,
      inputName,
      width,
      height,
      note,
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
  uppy: propTypes.uppy.isRequired,
  locale: propTypes.locale,
  inputName: PropTypes.string,
  width: PropTypes.string,
  height: PropTypes.string,
  note: PropTypes.string,
}
// Must be kept in sync with @uppy/drag-drop/src/DragDrop.jsx.
DragDrop.defaultProps = {
  locale: null,
  inputName: 'files[]',
  width: '100%',
  height: '100%',
  note: null,
}

export default DragDrop
