const { Component, toChildArray } = require('preact')

module.exports = class CloseWrapper extends Component {
  componentWillUnmount () {
    const { onUnmount } = this.props
    onUnmount()
  }

  render () {
    const { children } = this.props
    return toChildArray(children)[0]
  }
}
