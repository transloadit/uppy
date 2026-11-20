import type { UppyContext } from './context-provider.js'

import { inject } from 'vue'

import { UppyContextSymbol } from './context-provider.js'

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
