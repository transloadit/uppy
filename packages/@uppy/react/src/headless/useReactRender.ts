import { useRef } from 'react'
import { createRoot } from 'react-dom/client'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function useReactRender() {
  const rootsMapRef = useRef<Map<string, ReturnType<typeof createRoot>>>(
    new Map(),
  )

  const reactRender = (el: Element | null, node: any, id = 'default') => {
    const roots = rootsMapRef.current
    if (el) {
      if (!roots.has(id)) {
        roots.set(id, createRoot(el))
      }
      roots.get(id)?.render(node)
    } else if (id && roots.has(id)) {
      // Clean up when component unmounts
      roots.get(id)?.unmount()
      roots.delete(id)
    }
  }

  return reactRender
}
