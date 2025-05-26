import { getContext } from 'svelte'
import {
  type UppyContext,
  type FileInputProps,
  type FileInputFunctions,
} from '@uppy/components'
import { createFileInput } from '@uppy/components'
import { UppyContextKey } from './components/headless/UppyContextProvider.svelte'

export type SvelteFileInputFunctions = {
  getInputProps: () => {
    id: string
    type: 'file'
    multiple: boolean
    accept?: string
    onchange: (event: Event) => void
  }
  getButtonProps: () => {
    type: 'button'
    onclick: () => void
  }
}

export function useFileInput(props?: FileInputProps): SvelteFileInputFunctions {
  const ctx = getContext<UppyContext>(UppyContextKey)

  if (!ctx?.uppy) {
    throw new Error('useFileInput must be called within a UppyContextProvider')
  }

  const fileinput = createFileInput<Event>(ctx, props)

  return {
    // Only Svelte uses lowercase event names so we want to remap them
    ...fileinput,
    getButtonProps: () => {
      const { onClick, ...rest } = fileinput.getButtonProps()
      return {
        ...rest,
        onclick: onClick,
      }
    },
    getInputProps: () => {
      const { onChange, ...rest } = fileinput.getInputProps()
      return {
        ...rest,
        onchange: onChange,
      }
    },
  }
}
