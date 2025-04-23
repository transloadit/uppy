import { createApp, h, ref, type VNode } from 'vue'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useVueRender() {
  const rootsMapRef = ref<Map<string, ReturnType<typeof createApp>>>(new Map())

  // Accept VNode or array of VNodes for the 'node' parameter
  const vueRender = (
    el: Element | null,
    node: VNode | VNode[] | null,
    id = 'default',
  ) => {
    const roots = rootsMapRef.value
    if (el) {
      // Create a simple functional component that renders the provided VNode(s)
      const App = {
        render() {
          // Check if node is null before rendering
          return node ? h((): VNode | VNode[] => node) : null
        },
      }

      if (!roots.has(id)) {
        // Pass the functional component wrapper to createApp
        roots.set(id, createApp(App))
      }
      // Mount the wrapper component instance
      roots.get(id)?.mount(el)
    } else if (id && roots.has(id)) {
      // Clean up when component unmounts
      roots.get(id)?.unmount()
      roots.delete(id)
    }
  }

  return vueRender
}
