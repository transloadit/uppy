import { ToUppyProps } from './CommonTypes'
import ProgressBar = require('@uppy/progress-bar')

export type ProgressBarProps = ToUppyProps<ProgressBar.ProgressBarOptions> & React.BaseHTMLAttributes<HTMLDivElement>

/**
 * React component that renders a progress bar at the top of the page.
 */
declare const ProgressBarComponent: React.ComponentType<ProgressBarProps>
export default ProgressBarComponent
