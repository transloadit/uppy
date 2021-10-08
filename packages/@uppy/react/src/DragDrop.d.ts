import type { DragDropOptions } from '@uppy/drag-drop'
import { ToUppyProps } from './CommonTypes'

export type DragDropProps = ToUppyProps<DragDropOptions>  & React.BaseHTMLAttributes<HTMLDivElement>

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */
declare const DragDropComponent: React.ComponentType<DragDropProps>
export default DragDropComponent
