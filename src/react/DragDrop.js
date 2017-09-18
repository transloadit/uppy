const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core')
const DragDropPlugin = require('../plugins/DragDrop')

const h = React.createElement

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

class DragDrop extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    const options = Object.assign(
      {},
      this.props,
      { target: this.container }
    )
    delete options.uppy

    uppy.use(DragDropPlugin, options)

    this.plugin = uppy.getPlugin('DragDrop')
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
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  locale: PropTypes.object
}
DragDrop.defaultProps = {
}

module.exports = DragDrop
