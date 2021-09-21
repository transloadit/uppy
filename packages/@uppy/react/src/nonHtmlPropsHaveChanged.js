'use strict'

// TODO: replace with `Object.hasOwn` when dropping support for older browsers.
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

module.exports = function nonHtmlPropsHaveChanged (component, prevProps) {
  return Object.keys(component.props)
    // TODO: replace `validProps` with an exported `Symbol('htmlProps')`.
    .some(key => !hasOwn(component.validProps, key) && component.props[key] !== prevProps[key])
}
