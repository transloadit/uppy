import { type FileInputProps } from '@uppy/components'
import { createFileInput } from '@uppy/components'
import { injectUppyContext } from './headless/context-provider.js'

export type VueFileInputFunctions = {
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

export function useFileInput(props?: FileInputProps): VueFileInputFunctions {
  const ctx = injectUppyContext()

  const fileinput = createFileInput<Event>(ctx, props)

  return {
    // Vue.js uses lowercase event names when using v-bind so we need to remap them
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
