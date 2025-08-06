import getHTMLProps from './getHTMLProps.js'

export default function nonHtmlPropsHaveChanged<
  T extends Record<string, unknown>,
>(props: T, prevProps: T): boolean {
  // todo instead rewrite the components that use nonHtmlPropsHaveChanged
  // to hooks, so we can use useEffect on specific props instead of this hack
  const htmlProps = getHTMLProps(props)
  return Object.keys(props).some(
    (key) => !Object.hasOwn(htmlProps, key) && props[key] !== prevProps[key],
  )
}
