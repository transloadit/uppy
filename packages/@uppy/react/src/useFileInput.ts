import type { FileInputFunctions, FileInputProps } from '@uppy/components'
import { createFileInput } from '@uppy/components'
import { type ChangeEvent, useMemo } from 'react'
import { useUppyContext } from './headless/UppyContextProvider.js'

type TEvent = Event & ChangeEvent<HTMLInputElement>

export function useFileInput(
  props?: FileInputProps,
): FileInputFunctions<TEvent> {
  const ctx = useUppyContext()

  const fileInput = useMemo(
    () => createFileInput<TEvent>(ctx, props),
    // We need every value on props to be memoized to avoid re-creating the file input on every render
    [ctx, props?.accept, props?.multiple, props],
  )

  return fileInput
}
