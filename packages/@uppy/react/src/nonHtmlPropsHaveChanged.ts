export default function nonHtmlPropsHaveChanged (props, prevProps) {
  return Object.keys(props).some(key => !Object.hasOwn(props, key) && props[key] !== prevProps[key])
}
