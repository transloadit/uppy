import {
  cloneElement,
  Component,
  toChildArray,
  type ComponentChild,
} from 'preact'
import classNames from 'classnames'

type $TSFixMe = any

const transitionName = 'uppy-transition-slideDownUp'
const duration = 250

/**
 * Vertical slide transition.
 *
 * This can take a _single_ child component, which _must_ accept a `className` prop.
 *
 * Currently this is specific to the `uppy-transition-slideDownUp` transition,
 * but it should be simple to extend this for any type of single-element
 * transition by setting the CSS name and duration as props.
 */
class Slide extends Component {
  animationFrame: $TSFixMe

  enterTimeout: $TSFixMe

  leaveTimeout: $TSFixMe

  setState: $TSFixMe

  constructor(props: $TSFixMe) {
    super(props)

    this.state = {
      cachedChildren: null,
      className: '',
    }
  }

  componentDidUpdate() {
    const { cachedChildren } = this.state
    const child = toChildArray(this.props.children)[0]

    // Check if children have changed
    if (cachedChildren === child) return

    const patch = {
      cachedChildren: child,
    } as $TSFixMe

    // Enter transition
    if (child && !cachedChildren) {
      patch.className = `${transitionName}-enter`

      cancelAnimationFrame(this.animationFrame)
      clearTimeout(this.leaveTimeout)
      this.leaveTimeout = undefined

      this.animationFrame = requestAnimationFrame(() => {
        // Force it to render before we add the active class
        // this.base.getBoundingClientRect()
        this.setState({
          className: `${transitionName}-enter ${transitionName}-enter-active`,
        })

        this.enterTimeout = setTimeout(() => {
          this.setState({ className: '' })
        }, duration)
      })
    }

    // Leave transition
    if (cachedChildren && !child && this.leaveTimeout === undefined) {
      patch.cachedChildren = cachedChildren
      patch.className = `${transitionName}-leave`

      cancelAnimationFrame(this.animationFrame)
      clearTimeout(this.enterTimeout)
      this.enterTimeout = undefined
  
      this.animationFrame = requestAnimationFrame(() => {
        this.setState({
          className: `${transitionName}-leave ${transitionName}-leave-active`,
        })

        this.leaveTimeout = setTimeout(() => {
          this.setState({
            cachedChildren: null,
            className: '',
          })
        }, duration)
      })
    }

    this.setState(patch)
  }

  render(): ComponentChild {
    const { cachedChildren, className } = this.state as $TSFixMe

    if (!cachedChildren) {
      return null
    }

    return cloneElement(cachedChildren, {
      className: classNames(className, cachedChildren.props.className),
    })
  }
}

export default Slide
