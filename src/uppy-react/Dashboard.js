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
      locale: this.props.locale,
      maxWidth: this.props.maxWidth,
      maxHeight: this.props.maxHeight,
      semiTransparent: this.props.semiTransparent,
      showProgressDetails: this.props.showProgressDetails,
      // TODO Accept a React node here and render it so we can pass a DOM
      // element to this option.
      // defaultTabIcon: this.props.defaultTabIcon,
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
  uppy: React.PropTypes.instanceOf(UppyCore).isRequired,
  maxWidth: React.PropTypes.number,
  maxHeight: React.PropTypes.number,
  semiTransparent: React.PropTypes.bool,
  defaultTabIcon: React.PropTypes.node,
  showProgressDetails: React.PropTypes.bool,
  locale: React.PropTypes.object
}

Dashboard.defaultProps = {
  locale: {}
}

module.exports = Dashboard
