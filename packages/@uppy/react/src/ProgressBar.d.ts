import type { ProgressBarOptions } from '@uppy/progress-bar'
import { ToUppyProps } from './CommonTypes'

export type ProgressBarProps = ToUppyProps<ProgressBarOptions> & React.BaseHTMLAttributes<HTMLDivElement>

/**
 * React component that renders a progress bar at the top of the page.
 */
declare const ProgressBarComponent: React.ComponentType<ProgressBarProps>
export default ProgressBarComponent
