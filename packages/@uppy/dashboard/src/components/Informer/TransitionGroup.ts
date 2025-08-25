// INFO: not typing copy pasted libarary code
// @ts-nocheck
/**
 * @source https://github.com/developit/preact-transition-group
 */

import { Component, cloneElement, h, toChildArray } from 'preact'

function assign(obj, props) {
  return Object.assign(obj, props)
}
function getKey(vnode, fallback) {
  return vnode?.key ?? fallback
}
function linkRef(component, name) {
  // biome-ignore lint/suspicious/noAssignInExpressions: ...
  const cache = component._ptgLinkedRefs || (component._ptgLinkedRefs = {})
  return (
    cache[name] ||
    // biome-ignore lint/suspicious/noAssignInExpressions: ...
    (cache[name] = (c) => {
      component.refs[name] = c
    })
  )
}

function getChildMapping(children) {
  const out = {}
  for (let i = 0; i < children.length; i++) {
    if (children[i] != null) {
      const key = getKey(children[i], i.toString(36))
      out[key] = children[i]
    }
  }
  return out
}

function mergeChildMappings(prev, next) {
  prev = prev || {}
  next = next || {}

  const getValueForKey = (key) =>
    Object.hasOwn(next, key) ? next[key] : prev[key]

  // For each key of `next`, the list of keys to insert before that key in
  // the combined list
  const nextKeysPending = {}

  let pendingKeys = []
  for (const prevKey in prev) {
    if (Object.hasOwn(next, prevKey)) {
      if (pendingKeys.length) {
        nextKeysPending[prevKey] = pendingKeys
        pendingKeys = []
      }
    } else {
      pendingKeys.push(prevKey)
    }
  }

  const childMapping = {}
  for (const nextKey in next) {
    if (Object.hasOwn(nextKeysPending, nextKey)) {
      for (let i = 0; i < nextKeysPending[nextKey].length; i++) {
        const pendingNextKey = nextKeysPending[nextKey][i]
        childMapping[nextKeysPending[nextKey][i]] =
          getValueForKey(pendingNextKey)
      }
    }
    childMapping[nextKey] = getValueForKey(nextKey)
  }

  // Finally, add the keys which didn't appear before any key in `next`
  for (let i = 0; i < pendingKeys.length; i++) {
    childMapping[pendingKeys[i]] = getValueForKey(pendingKeys[i])
  }

  return childMapping
}

const identity = (i) => i

class TransitionGroup extends Component {
  constructor(props, context) {
    super(props, context)

    this.refs = {}

    this.state = {
      children: getChildMapping(
        toChildArray(toChildArray(this.props.children)) || [],
      ),
    }

    this.performAppear = this.performAppear.bind(this)
    this.performEnter = this.performEnter.bind(this)
    this.performLeave = this.performLeave.bind(this)
  }

  componentWillMount() {
    this.currentlyTransitioningKeys = {}
    this.keysToAbortLeave = []
    this.keysToEnter = []
    this.keysToLeave = []
  }

  componentDidMount() {
    const initialChildMapping = this.state.children
    for (const key in initialChildMapping) {
      if (initialChildMapping[key]) {
        // this.performAppear(getKey(initialChildMapping[key], key));
        this.performAppear(key)
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const nextChildMapping = getChildMapping(
      toChildArray(nextProps.children) || [],
    )
    const prevChildMapping = this.state.children

    this.setState((prevState) => ({
      children: mergeChildMappings(prevState.children, nextChildMapping),
    }))

    let key: string

    for (key in nextChildMapping) {
      if (Object.hasOwn(nextChildMapping, key)) {
        const hasPrev = prevChildMapping && Object.hasOwn(prevChildMapping, key)
        // We should re-enter the component and abort its leave function
        if (
          nextChildMapping[key] &&
          hasPrev &&
          this.currentlyTransitioningKeys[key]
        ) {
          this.keysToEnter.push(key)
          this.keysToAbortLeave.push(key)
        } else if (
          nextChildMapping[key] &&
          !hasPrev &&
          !this.currentlyTransitioningKeys[key]
        ) {
          this.keysToEnter.push(key)
        }
      }
    }

    for (key in prevChildMapping) {
      if (Object.hasOwn(prevChildMapping, key)) {
        const hasNext = nextChildMapping && Object.hasOwn(nextChildMapping, key)
        if (
          prevChildMapping[key] &&
          !hasNext &&
          !this.currentlyTransitioningKeys[key]
        ) {
          this.keysToLeave.push(key)
        }
      }
    }
  }

  componentDidUpdate() {
    const { keysToEnter } = this
    this.keysToEnter = []
    keysToEnter.forEach(this.performEnter)

    const { keysToLeave } = this
    this.keysToLeave = []
    keysToLeave.forEach(this.performLeave)
  }

  _finishAbort(key) {
    const idx = this.keysToAbortLeave.indexOf(key)
    if (idx !== -1) {
      this.keysToAbortLeave.splice(idx, 1)
    }
  }

  performAppear(key) {
    this.currentlyTransitioningKeys[key] = true

    const component = this.refs[key]

    if (component?.componentWillAppear) {
      component.componentWillAppear(this._handleDoneAppearing.bind(this, key))
    } else {
      this._handleDoneAppearing(key)
    }
  }

  _handleDoneAppearing(key) {
    const component = this.refs[key]
    if (component?.componentDidAppear) {
      component.componentDidAppear()
    }

    delete this.currentlyTransitioningKeys[key]
    this._finishAbort(key)

    const currentChildMapping = getChildMapping(
      toChildArray(this.props.children) || [],
    )

    if (!currentChildMapping || !Object.hasOwn(currentChildMapping, key)) {
      // This was removed before it had fully appeared. Remove it.
      this.performLeave(key)
    }
  }

  performEnter(key) {
    this.currentlyTransitioningKeys[key] = true

    const component = this.refs[key]

    if (component?.componentWillEnter) {
      component.componentWillEnter(this._handleDoneEntering.bind(this, key))
    } else {
      this._handleDoneEntering(key)
    }
  }

  _handleDoneEntering(key) {
    const component = this.refs[key]
    if (component?.componentDidEnter) {
      component.componentDidEnter()
    }

    delete this.currentlyTransitioningKeys[key]
    this._finishAbort(key)

    const currentChildMapping = getChildMapping(
      toChildArray(this.props.children) || [],
    )

    if (!currentChildMapping || !Object.hasOwn(currentChildMapping, key)) {
      // This was removed before it had fully entered. Remove it.
      this.performLeave(key)
    }
  }

  performLeave(key) {
    // If we should immediately abort this leave function,
    // don't run the leave transition at all.
    const idx = this.keysToAbortLeave.indexOf(key)
    if (idx !== -1) {
      return
    }

    this.currentlyTransitioningKeys[key] = true

    const component = this.refs[key]
    if (component?.componentWillLeave) {
      component.componentWillLeave(this._handleDoneLeaving.bind(this, key))
    } else {
      // Note that this is somewhat dangerous b/c it calls setState()
      // again, effectively mutating the component before all the work
      // is done.
      this._handleDoneLeaving(key)
    }
  }

  _handleDoneLeaving(key) {
    // If we should immediately abort the leave,
    // then skip this altogether
    const idx = this.keysToAbortLeave.indexOf(key)
    if (idx !== -1) {
      return
    }

    const component = this.refs[key]

    if (component?.componentDidLeave) {
      component.componentDidLeave()
    }

    delete this.currentlyTransitioningKeys[key]

    const currentChildMapping = getChildMapping(
      toChildArray(this.props.children) || [],
    )

    if (currentChildMapping && Object.hasOwn(currentChildMapping, key)) {
      // This entered again before it fully left. Add it again.
      this.performEnter(key)
    } else {
      const children = assign({}, this.state.children)
      delete children[key]
      this.setState({ children })
    }
  }

  render(
    {
      childFactory,
      transitionLeave,
      transitionName,
      transitionAppear,
      transitionEnter,
      transitionLeaveTimeout,
      transitionEnterTimeout,
      transitionAppearTimeout,
      component,
      ...props
    },
    { children },
  ) {
    // TODO: we could get rid of the need for the wrapper node
    // by cloning a single child
    const childrenToRender = Object.entries(children)
      .map(([key, child]) => {
        if (!child) return undefined

        const ref = linkRef(this, key)
        return cloneElement(childFactory(child), { ref, key })
      })
      .filter(Boolean)

    return h(component, props, childrenToRender)
  }
}

TransitionGroup.defaultProps = {
  component: 'span',
  childFactory: identity,
}

export default TransitionGroup
