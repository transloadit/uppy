'use strict'

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

module.exports = function nonHtmlPropsHaveChanged (component, prevProps) {
  return Object.keys(component.props)
    .some(key => !hasOwn(component.validProps, key) && component.props[key] !== prevProps[key])
}
