const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core/Core')
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
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  locale: PropTypes.object
}

DragDrop.defaultProps = {
  locale: {}
}

module.exports = DragDrop
