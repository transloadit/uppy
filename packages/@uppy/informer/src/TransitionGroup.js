/*
BSD 3-Clause License

Copyright (c) 2018, React Community
Forked from React (https://github.com/facebook/react) Copyright 2013-present, Facebook, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Source: https://github.com/reactjs/react-transition-group
*/
/* eslint-disable */
'use strict'

const { Component, cloneElement, createContext, h, isValidElement, toChildArray } = require('preact')

const TransitionGroupContext = createContext(null)

/**
 * Given `this.props.children`, return an object mapping key to child.
 *
 * @param {*} children `this.props.children`
 * @returns {object} Mapping of key to child
 */
function getChildMapping (children, mapFn) {
  const mapper = (child) => (mapFn && isValidElement(child) ? mapFn(child) : child)

  const result = Object.create(null)
  if (children) {
    toChildArray(children).forEach((child) => {
    // run the map function here instead so that the key is the computed one
      result[child.key] = mapper(child)
    })
  }
  return result
}

/**
 * When you're adding or removing children some may be added or removed in the
 * same render pass. We want to show *both* since we want to simultaneously
 * animate elements in and out. This function takes a previous set of keys
 * and a new set of keys and merges them with its best guess of the correct
 * ordering. In the future we may expose some of the utilities in
 * ReactMultiChild to make this easy, but for now React itself does not
 * directly have this concept of the union of prevChildren and nextChildren
 * so we implement it here.
 *
 * @param {object} prev prev children as returned from
 * `ReactTransitionChildMapping.getChildMapping()`.
 * @param {object} next next children as returned from
 * `ReactTransitionChildMapping.getChildMapping()`.
 * @returns {object} a key set that contains all keys in `prev` and all keys
 * in `next` in a reasonable order.
 */
function mergeChildMappings (prev, next) {
  prev = prev || {}
  next = next || {}

  function getValueForKey (key) {
    return key in next ? next[key] : prev[key]
  }

  // For each key of `next`, the list of keys to insert before that key in
  // the combined list
  const nextKeysPending = Object.create(null)

  let pendingKeys = []
  for (const prevKey in prev) {
    if (prevKey in next) {
      if (pendingKeys.length) {
        nextKeysPending[prevKey] = pendingKeys
        pendingKeys = []
      }
    } else {
      pendingKeys.push(prevKey)
    }
  }

  let i
  const childMapping = {}
  for (const nextKey in next) {
    if (nextKeysPending[nextKey]) {
      for (i = 0; i < nextKeysPending[nextKey].length; i++) {
        const pendingNextKey = nextKeysPending[nextKey][i]
        childMapping[nextKeysPending[nextKey][i]]
          = getValueForKey(pendingNextKey)
      }
    }
    childMapping[nextKey] = getValueForKey(nextKey)
  }

  // Finally, add the keys which didn't appear before any key in `next`
  for (i = 0; i < pendingKeys.length; i++) {
    childMapping[pendingKeys[i]] = getValueForKey(pendingKeys[i])
  }

  return childMapping
}

function getProp (child, prop, props) {
  return props[prop] != null ? props[prop] : child.props[prop]
}

function getInitialChildMapping (props, onExited) {
  return getChildMapping(props.children, (child) => {
    return cloneElement(child, {
      onExited: onExited.bind(null, child),
      in: true,
      appear: getProp(child, 'appear', props),
      enter: getProp(child, 'enter', props),
      exit: getProp(child, 'exit', props),
    })
  })
}

function getNextChildMapping (nextProps, prevChildMapping, onExited) {
  const nextChildMapping = getChildMapping(nextProps.children)
  const children = mergeChildMappings(prevChildMapping, nextChildMapping)

  Object.keys(children).forEach((key) => {
    const child = children[key]

    if (!isValidElement(child)) return

    const hasPrev = key in prevChildMapping
    const hasNext = key in nextChildMapping

    const prevChild = prevChildMapping[key]
    const isLeaving = isValidElement(prevChild) && !prevChild.props.in

    // item is new (entering)
    if (hasNext && (!hasPrev || isLeaving)) {
      // console.log('entering', key)
      children[key] = cloneElement(child, {
        onExited: onExited.bind(null, child),
        in: true,
        exit: getProp(child, 'exit', nextProps),
        enter: getProp(child, 'enter', nextProps),
      })
    } else if (!hasNext && hasPrev && !isLeaving) {
      // item is old (exiting)
      // console.log('leaving', key)
      children[key] = cloneElement(child, { in: false })
    } else if (hasNext && hasPrev && isValidElement(prevChild)) {
      // item hasn't changed transition states
      // copy over the last transition props;
      // console.log('unchanged', key)
      children[key] = cloneElement(child, {
        onExited: onExited.bind(null, child),
        in: prevChild.props.in,
        exit: getProp(child, 'exit', nextProps),
        enter: getProp(child, 'enter', nextProps),
      })
    }
  })

  return children
}

const values = Object.values || ((obj) => Object.keys(obj).map((k) => obj[k]))

const defaultProps = {
  component: 'div',
  childFactory: (child) => child,
}

/**
 * The `<TransitionGroup>` component manages a set of transition components
 * (`<Transition>` and `<CSSTransition>`) in a list. Like with the transition
 * components, `<TransitionGroup>` is a state machine for managing the mounting
 * and unmounting of components over time.
 *
 * Consider the example below. As items are removed or added to the TodoList the
 * `in` prop is toggled automatically by the `<TransitionGroup>`.
 *
 * Note that `<TransitionGroup>`  does not define any animation behavior!
 * Exactly _how_ a list item animates is up to the individual transition
 * component. This means you can mix and match animations across different list
 * items.
 */
class TransitionGroup extends Component {
  constructor (props, context) {
    super(props, context)

    const handleExited = this.handleExited.bind(this)

    // Initial children should all be entering, dependent on appear
    this.state = {
      contextValue: { isMounting: true },
      handleExited,
      firstRender: true,
    }
  }

  componentDidMount () {
    this.mounted = true
    this.setState({
      contextValue: { isMounting: false },
    })
  }

  componentWillUnmount () {
    this.mounted = false
  }

  static getDerivedStateFromProps (
    nextProps,
    { children: prevChildMapping, handleExited, firstRender }
  ) {
    return {
      children: firstRender
        ? getInitialChildMapping(nextProps, handleExited)
        : getNextChildMapping(nextProps, prevChildMapping, handleExited),
      firstRender: false,
    }
  }

  // node is `undefined` when user provided `nodeRef` prop
  handleExited (child, node) {
    const currentChildMapping = getChildMapping(this.props.children)

    if (child.key in currentChildMapping) return

    if (child.props.onExited) {
      child.props.onExited(node)
    }

    if (this.mounted) {
      this.setState((state) => {
        const children = { ...state.children }

        delete children[child.key]
        return { children }
      })
    }
  }

  render () {
    const { component: Component, childFactory, ...props } = this.props
    const { contextValue } = this.state
    const children = values(this.state.children).map(childFactory)

    delete props.appear
    delete props.enter
    delete props.exit

    if (Component === null) {
      return (
        <TransitionGroupContext.Provider value={contextValue}>
          {children}
        </TransitionGroupContext.Provider>
      )
    }
    return (
      <TransitionGroupContext.Provider value={contextValue}>
        <Component {...props}>{children}</Component>
      </TransitionGroupContext.Provider>
    )
  }
}

TransitionGroup.defaultProps = defaultProps

module.exports = TransitionGroup
