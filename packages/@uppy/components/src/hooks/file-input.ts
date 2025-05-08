export type FileInputProps = {
  multiple?: boolean
  accept?: string
}

export type FileInputFunctions<E> = {
  getInputProps: () => {
    type: 'file'
    multiple: boolean
    onChange: (event: E) => void
    style?: { display: 'none' }
  }
  getButtonProps: () => {
    type: 'button'
    onClick: () => void
  }
}
