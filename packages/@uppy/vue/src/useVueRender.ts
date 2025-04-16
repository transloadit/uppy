import { createApp, ref } from 'vue'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useVueRender() {
    const rootsMapRef = ref<Map<string, ReturnType<typeof createApp>>>(
      new Map(),
    )
  
    const vueRender = (el: Element | null, node: any, id = 'default') => {
      const roots = rootsMapRef.value
      if (el) {
        if (!roots.has(id)) {
          roots.set(id, createApp(node))
        }
        roots.get(id)?.mount(el)
      } else if (id && roots.has(id)) {
        // Clean up when component unmounts
        roots.get(id)?.unmount()
        roots.delete(id)
      }
    }
  
    return vueRender
  }