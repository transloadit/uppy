const { h, Component, createRef } = require('preact')

module.exports = class FadeIn extends Component {
  ref = createRef();

  componentWillEnter (callback) {
    this.ref.current.style.opacity = '1'
    this.ref.current.style.transform = 'none'
    setTimeout(callback, 400)
  }

  componentWillLeave (callback) {
    this.ref.current.style.opacity = '0'
    this.ref.current.style.transform = 'translateY(350%)'
    setTimeout(callback, 400)
  }

  render () {
    const { children } = this.props

    return (
      <div className="uppy-Informer-animated" ref={this.ref}>
        {children}
      </div>
    )
  }
}
