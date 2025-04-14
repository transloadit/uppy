import { useRef } from 'react'
import { createRoot } from 'react-dom/client'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function useReactRender() {
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null)

  const reactRender = (el: Element | null, node: any) => {
    if (!rootRef.current && el) {
      rootRef.current = createRoot(el)
    }
    rootRef.current?.render(node)
  }

  return reactRender
}
