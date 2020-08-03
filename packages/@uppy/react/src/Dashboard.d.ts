import { Omit, ToUppyProps } from './CommonTypes'
import Dashboard = require('@uppy/dashboard')

// This type is mapped into `DashboardProps` below so IntelliSense doesn't display this big mess of nested types
type DashboardPropsInner = Omit<
  ToUppyProps<Dashboard.DashboardOptions>,
  // Remove the modal-only props
  'animateOpenClose' | 'browserBackButtonClose' | 'inline' | 'onRequestCloseModal' | 'trigger'
> & React.BaseHTMLAttributes<HTMLDivElement>

export type DashboardProps = {
   [K in keyof DashboardPropsInner]: DashboardPropsInner[K]
}

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline so you can put it anywhere you want.
 */
declare const DashboardComponent: React.ComponentType<DashboardProps>
export default DashboardComponent
