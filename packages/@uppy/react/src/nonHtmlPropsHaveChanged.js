'use strict'

export default function nonHtmlPropsHaveChanged (component, prevProps) {
  return Object.keys(component.props)
    .some(key => !Object.hasOwn(component[Symbol.for('htmlProps')()], key) && component.props[key] !== prevProps[key])
}
