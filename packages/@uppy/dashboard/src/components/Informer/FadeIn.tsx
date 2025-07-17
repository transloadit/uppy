import { Component, type ComponentChild, createRef, h } from 'preact'

const TRANSITION_MS = 300

export default class FadeIn extends Component {
  ref = createRef()

  componentWillEnter(callback: () => void): void {
    this.ref.current.style.opacity = '1'
    this.ref.current.style.transform = 'none'
    setTimeout(callback, TRANSITION_MS)
  }

  componentWillLeave(callback: () => void): void {
    this.ref.current.style.opacity = '0'
    this.ref.current.style.transform = 'translateY(350%)'
    setTimeout(callback, TRANSITION_MS)
  }

  render(): ComponentChild {
    const { children } = this.props

    return (
      <div className="uppy-Informer-animated" ref={this.ref}>
        {children}
      </div>
    )
  }
}
