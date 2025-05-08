import { useRef, useContext, type ChangeEvent } from 'react'
import type { FileInputProps, FileInputFunctions } from '@uppy/components'
import { UppyContext } from './headless/UppyContextProvider.js'

export function useFileInput(
  props?: FileInputProps,
): FileInputFunctions<ChangeEvent<HTMLInputElement>> {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ctx = useContext(UppyContext)

  function handleClick() {
    fileInputRef.current!.click()
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    if (!files.length) return
    ctx.uppy?.addFiles(
      files.map((file) => ({
        source: 'file-input',
        name: file.name,
        type: file.type,
        data: file,
      })),
    )

    // Reset the input value so the same file can be selected again
    input.value = ''
  }

  return {
    getInputProps: () => ({
      type: 'file',
      style: { display: 'none' },
      ref: fileInputRef,
      multiple: props?.multiple || true,
      accept: props?.accept,
      onChange: handleFileInputChange,
    }),
    getButtonProps: () => ({
      type: 'button',
      onClick: handleClick,
    }),
  }
}
