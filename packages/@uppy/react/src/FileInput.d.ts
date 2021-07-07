import FileInput from '@uppy/file-input'
import { ToUppyProps } from './CommonTypes'

export type FileInputProps = ToUppyProps<FileInput.FileInputOptions>

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */
declare const FileInputComponent: React.ComponentType<FileInputProps>
export default FileInputComponent
