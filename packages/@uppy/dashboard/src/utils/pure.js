const shallowEqual = require('is-shallow-equal')
const { h, Component } = require('preact')

/**
 * Higher order component that doesn't rerender an element if its props didn't change.
 */
module.exports = function pure (Inner) {
  return class Pure extends Component {
    shouldComponentUpdate (nextProps) {
      return !shallowEqual(this.props, nextProps)
    }

    render () {
      // we have to clone this or Preact mutates it:
      // https://github.com/preactjs/preact/issues/836
      // TODO can be removed if we upgrade to Preact X
      const props = { ...this.props }
      return <Inner {...props} />
    }
  }
}
