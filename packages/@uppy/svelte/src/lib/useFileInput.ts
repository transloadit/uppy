import {
  type FileInputProps,
} from '@uppy/components'
import { createFileInput } from '@uppy/components'
import { getUppyContext } from './components/headless/uppyContext.js'

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
  const ctx = getUppyContext()

  const fileinput = createFileInput<Event>(
    ctx,
    props,
  )

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
