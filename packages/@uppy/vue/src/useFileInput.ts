import { inject } from 'vue'
import {
  type FileInputProps,
  type NonNullableUppyContext,
} from '@uppy/components'
import { createFileInput } from '@uppy/components'
import {
  UppyContextSymbol,
  type UppyContext,
} from './headless/context-provider.js'

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
  const ctx = inject<UppyContext>(UppyContextSymbol)

  if (!ctx?.uppy) {
    throw new Error('useFileInput must be called within a UppyContextProvider')
  }

  const fileinput = createFileInput<Event>(
    ctx as NonNullableUppyContext, // covered by the if statement above
    props,
  )

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
