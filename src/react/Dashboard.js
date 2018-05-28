const React = require('react')
const DashboardPlugin = require('../plugins/Dashboard')
const basePropTypes = require('./propTypes').dashboard

const h = React.createElement

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline, so you can put it anywhere you want.
 */

class Dashboard extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    const options = Object.assign(
      { id: 'react:Dashboard' },
      this.props,
      { target: this.container }
    )
    delete options.uppy
    uppy.use(DashboardPlugin, options)

    this.plugin = uppy.getPlugin('react:Dashboard')
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

Dashboard.propTypes = basePropTypes

Dashboard.defaultProps = {
  inline: true
}

module.exports = Dashboard
