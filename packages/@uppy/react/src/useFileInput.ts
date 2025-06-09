import { useMemo, type ChangeEvent } from 'react'
import type { FileInputProps, FileInputFunctions } from '@uppy/components'
import { createFileInput } from '@uppy/components'
import { useUppyContext } from './headless/UppyContextProvider.js'

type TEvent = Event & ChangeEvent<HTMLInputElement>

export function useFileInput(
  props?: FileInputProps,
): FileInputFunctions<TEvent> {
  const ctx = useUppyContext()

  const fileInput = useMemo(
    () => createFileInput<TEvent>(ctx, props),
    // We need every value on props to be memoized to avoid re-creating the file input on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, props?.accept, props?.multiple],
  )

  return fileInput
}
