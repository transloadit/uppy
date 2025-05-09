import { getContext } from 'svelte'
import {
  type UppyContext,
  type FileInputProps,
  type FileInputFunctions,
} from '@uppy/components'
import { createFileInput } from '@uppy/components'
import { UppyContextKey } from './components/headless/UppyContextProvider.svelte'

export function useFileInput(
  props?: FileInputProps,
): FileInputFunctions<Event> {
  const ctx = getContext<UppyContext>(UppyContextKey)

  if (!ctx?.uppy) {
    throw new Error('useFileInput must be called within a UppyContextProvider')
  }

  return createFileInput<Event>(ctx, props)
}
