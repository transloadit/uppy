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
    const options = Object.assign(
      {},
      this.props,
      { target: this.container }
    )
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
  plugins: PropTypes.arrayOf(PropTypes.string),
  inline: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  semiTransparent: PropTypes.bool,
  showProgressDetails: PropTypes.bool,
  hideUploadButton: PropTypes.bool,
  note: PropTypes.string,
  locale: PropTypes.object
}
Dashboard.defaultProps = {
  inline: true
}

module.exports = Dashboard
