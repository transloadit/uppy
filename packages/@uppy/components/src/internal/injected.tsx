import { Fragment, h, type ComponentChild } from 'preact'
import { useRef, useEffect } from 'preact/hooks'
import type { Render, Component } from '../types'

export function InjectedOrChildren(props: {
  render: Render
  children?: ComponentChild
  item: () => Component
  id: string
}) {
  const { render, item, id, children } = props
  const ref = useRef<HTMLDivElement>(null)
  const component = item()

  useEffect(() => {
    const currentRef = ref.current
    if (component && currentRef) {
      render(currentRef, component, id)
    }
    return () => {
      if (component && currentRef) {
        render(currentRef, null, id)
      }
    }
  }, [render, item, id, component])

  return component ? <div ref={ref} /> : <Fragment>{children}</Fragment>
}
