import { inject } from 'vue'
import { type UppyContext, UppyContextSymbol } from './context-provider.js'

export function useUppyContext(): UppyContext {
  const context = inject<UppyContext>(UppyContextSymbol)

  if (!context) {
    return {
      uppy: undefined,
      status: 'init',
      progress: 0,
    }
  }

  return context
}
