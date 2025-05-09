import { inject } from 'vue'
import { type FileInputProps, type FileInputFunctions } from '@uppy/components'
import { createFileInput } from '@uppy/components'
import {
  UppyContextSymbol,
  type UppyContext,
} from './headless/context-provider.js'

export function useFileInput(
  props?: FileInputProps,
): FileInputFunctions<Event> {
  const ctx = inject<UppyContext>(UppyContextSymbol)

  if (!ctx?.uppy) {
    throw new Error('useFileInput must be called within a UppyContextProvider')
  }

  return createFileInput<Event>(ctx, props)
}
