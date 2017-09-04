const React = require('react')
const PropTypes = require('prop-types')
const UppyCore = require('../core/Core')
const DashboardPlugin = require('../plugins/Dashboard')

const h = React.createElement

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline, so you can put it anywhere you want.
 */

class Dashboard extends React.Component {
  componentDidMount () {
    const uppy = this.props.uppy
    const options = Object.assign({}, this.props, {
      target: this.container,
      inline: true
    })
    delete options.uppy
    uppy.use(DashboardPlugin, options)

    this.plugin = uppy.getPlugin('DashboardUI')
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

Dashboard.propTypes = {
  uppy: PropTypes.instanceOf(UppyCore).isRequired,
  maxWidth: PropTypes.number,
  maxHeight: PropTypes.number,
  semiTransparent: PropTypes.bool,
  defaultTabIcon: PropTypes.node,
  showProgressDetails: PropTypes.bool,
  locale: PropTypes.object
}

Dashboard.defaultProps = {
  locale: {}
}

module.exports = Dashboard
