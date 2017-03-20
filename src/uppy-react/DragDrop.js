const React = require('react')
const UppyCore = require('../core/Core').Uppy
const DragDropPlugin = require('../plugins/DragDrop')

const h = React.createElement

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

class DragDrop extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    uppy.use(DragDropPlugin, {
      target: this.container,
      locale: this.props.locale
    })
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
  uppy: React.PropTypes.instanceOf(UppyCore).isRequired,
  locale: React.PropTypes.object
}

DragDrop.defaultProps = {
  locale: {}
}

module.exports = DragDrop
