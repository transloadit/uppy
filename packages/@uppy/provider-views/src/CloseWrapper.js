const { Component } = require('preact')

module.exports = class CloseWrapper extends Component {
  componentWillUnmount () {
    this.props.onUnmount()
  }

  render () {
    return this.props.children[0]
  }
}
