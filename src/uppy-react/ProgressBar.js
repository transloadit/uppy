const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core/Core')
const UppyWrapper = require('./Wrapper')

const h = React.createElement

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

const ProgressBar = (props) =>
  h(UppyWrapper, props)

ProgressBar.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired
}
ProgressBar.defaultProps = {
  plugin: 'ProgressBar'
}

module.exports = ProgressBar
