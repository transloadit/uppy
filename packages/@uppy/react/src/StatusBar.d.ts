import { ToUppyProps } from './CommonTypes'
import StatusBar = require('@uppy/status-bar')

export type StatusBarProps = ToUppyProps<StatusBar.StatusBarOptions>

/**
 * React component that renders a status bar containing upload progress and speed,
 * processing progress and pause/resume/cancel controls.
 */
declare const StatusBarComponent: React.ComponentType<StatusBarProps>
export default StatusBarComponent
