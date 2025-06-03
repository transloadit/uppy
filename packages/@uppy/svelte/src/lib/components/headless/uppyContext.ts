import { getContext } from 'svelte'
import {
  type UppyContext,
} from '@uppy/components'

import { UppyContextKey, UppyStateKey } from './UppyContextProvider.svelte'
import type Uppy from '@uppy/core'

export function getUppyContext() {
  const uppy = getContext<Uppy | undefined>(UppyContextKey)
  const state = getContext<UppyContext>(UppyStateKey)

  if (!uppy) {
    throw new Error('Component must be called within a UppyContextProvider')
  }

  return { ...state, uppy }
}