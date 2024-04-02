export default function nonHtmlPropsHaveChanged<
  T extends Record<string, unknown>,
>(props: T, prevProps: T): boolean {
  return Object.keys(props).some(
    (key) => !Object.hasOwn(props, key) && props[key] !== prevProps[key],
  )
}
