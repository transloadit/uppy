import { useContext, useMemo, type ChangeEvent } from 'react'
import type {
  FileInputProps,
  FileInputFunctions,
  NonNullableUppyContext,
} from '@uppy/components'
import { createFileInput } from '@uppy/components'
import { UppyContext } from './headless/UppyContextProvider.js'

type TEvent = Event & ChangeEvent<HTMLInputElement>

export function useFileInput(
  props?: FileInputProps,
): FileInputFunctions<TEvent> {
  const ctx = useContext(UppyContext)

  if (!ctx.uppy) {
    throw new Error('useFileInput must be called within a UppyContextProvider')
  }

  const fileInput = useMemo(
    () =>
      createFileInput<TEvent>(
        ctx as NonNullableUppyContext, // covered by the if statement above
        props,
      ),
    // We need every value on props to be memoized to avoid re-creating the file input on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, props?.accept, props?.multiple],
  )

  return fileInput
}
