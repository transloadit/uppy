const React = require('react')
const UppyCore = require('../core/Core').Uppy
const DashboardPlugin = require('../plugins/Dashboard')

const h = React.createElement

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline, so you can put it anywhere you want.
 */

class Dashboard extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    uppy.use(DashboardPlugin, {
      target: this.container,
      inline: true
    })

    this.plugin = uppy.getPlugin('DashboardUI')
  }

  render () {
    return h('div', {
      ref: (container) => {
        this.container = container
      }
    })
  }
}

Dashboard.propTypes = {
  uppy: React.PropTypes.instanceOf(UppyCore).isRequired
}

module.exports = Dashboard
