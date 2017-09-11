const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core')
const UppyWrapper = require('./Wrapper')

const h = React.createElement

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

const DragDrop = (props) =>
  h(UppyWrapper, props)

DragDrop.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired
}
DragDrop.defaultProps = {
  plugin: 'DragDrop'
}

module.exports = DragDrop
