import type { StatusBarOptions } from '@uppy/status-bar'
import type { ToUppyProps } from './CommonTypes'

export type StatusBarProps = ToUppyProps<StatusBarOptions> &
  React.BaseHTMLAttributes<HTMLDivElement>

/**
 * React component that renders a status bar containing upload progress and speed,
 * processing progress and pause/resume/cancel controls.
 */
declare const StatusBarComponent: React.ComponentType<StatusBarProps>
export default StatusBarComponent
