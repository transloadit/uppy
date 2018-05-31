const React = require('react')
const DragDropPlugin = require('../plugins/DragDrop')
const propTypes = require('./propTypes')

const h = React.createElement

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

class DragDrop extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    const options = Object.assign(
      { id: 'react:DragDrop' },
      this.props,
      { target: this.container }
    )
    delete options.uppy

    uppy.use(DragDropPlugin, options)

    this.plugin = uppy.getPlugin(options.id)
  }

  componentWillUnmount () {
    const uppy = this.props.uppy

    uppy.removePlugin(this.plugin)
  }

  render () {
    return h('div', {
      ref: (container) => {
        this.container = container
      }
    })
  }
}

DragDrop.propTypes = {
  uppy: propTypes.uppy,
  locale: propTypes.locale
}
DragDrop.defaultProps = {
}

module.exports = DragDrop
