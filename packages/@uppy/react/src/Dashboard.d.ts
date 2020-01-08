import { ToUppyProps } from './CommonTypes'
import Dashboard = require('@uppy/dashboard')

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type DashboardProps = Omit<
  ToUppyProps<Dashboard.DashboardOptions>,
  // Remove the modal-only props
  'inline' | 'browserBackButtonClose' | 'onRequestCloseModal'
>

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline so you can put it anywhere you want.
 */
declare const DashboardComponent: React.ComponentType<DashboardProps>
export default DashboardComponent
