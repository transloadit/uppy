const React = require('react')
const PropTypes = require('prop-types')
const uppyPropType = require('./propTypes').uppy

const h = React.createElement

class UppyWrapper extends React.Component {
  constructor (props) {
    super(props)

    this.refContainer = this.refContainer.bind(this)
  }

  componentDidMount () {
    const plugin = this.props.uppy
      .getPlugin(this.props.plugin)

    plugin.mount(this.container, plugin)
  }

  componentWillUnmount () {
    const plugin = this.props.uppy
      .getPlugin(this.props.plugin)

    plugin.unmount()
  }

  refContainer (container) {
    this.container = container
  }

  render () {
    return h('div', { ref: this.refContainer })
  }
}

UppyWrapper.propTypes = {
  uppy: uppyPropType,
  plugin: PropTypes.string.isRequired
}

module.exports = UppyWrapper
