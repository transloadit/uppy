import { useContext, useMemo, type ChangeEvent } from 'react'
import { type FileInputProps, type FileInputFunctions } from '@uppy/components'
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
    () => createFileInput<TEvent>(ctx, props),
    [ctx, props],
  )

  return fileInput
}
