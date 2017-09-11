const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core/Core')
const UppyWrapper = require('./Wrapper')

const h = React.createElement

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline, so you can put it anywhere you want.
 */

const Dashboard = (props) =>
  h(UppyWrapper, props)

Dashboard.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired
}
Dashboard.defaultProps = {
  plugin: 'DashboardUI'
}

module.exports = Dashboard
