import { ToUppyProps } from './CommonTypes'
import FileInput = require('@uppy/file-input')

export type FileInputProps = ToUppyProps<FileInput.FileInputOptions>

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */
declare const FileInputComponent: React.ComponentType<FileInputProps>;
export default FileInputComponent;

