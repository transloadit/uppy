import { Component, toChildArray } from 'preact'

export default class CloseWrapper extends Component {
  componentWillUnmount () {
    const { onUnmount } = this.props
    onUnmount()
  }

  render () {
    const { children } = this.props
    return toChildArray(children)[0]
  }
}
