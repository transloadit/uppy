export default function nonHtmlPropsHaveChanged<T>(
  props: T,
  prevProps: T,
): boolean {
  return Object.keys(props).some(
    (key) => !Object.hasOwn(props, key) && props[key] !== prevProps[key],
  )
}
