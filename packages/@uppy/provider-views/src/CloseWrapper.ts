import { Component, toChildArray } from 'preact'

export default class CloseWrapper extends Component<{ onUnmount: () => void }> {
  componentWillUnmount(): void {
    const { onUnmount } = this.props
    onUnmount()
  }

  render(): ReturnType<typeof toChildArray>[0] {
    const { children } = this.props
    return toChildArray(children)[0]
  }
}
