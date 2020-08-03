import { Omit, ToUppyProps } from './CommonTypes'
import Dashboard = require('@uppy/dashboard')

// This type is mapped into `DashboardModalProps` below so IntelliSense doesn't display this big mess of nested types
type DashboardModalPropsInner = {
  open?: boolean
  onRequestClose?: VoidFunction
} & Omit<
  ToUppyProps<Dashboard.DashboardOptions>,
  // Remove the inline-only and force-overridden props
  'inline' | 'onRequestCloseModal'
> & React.BaseHTMLAttributes<HTMLDivElement>

export type DashboardModalProps = {
  [K in keyof DashboardModalPropsInner]: DashboardModalPropsInner[K]
}

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline so you can put it anywhere you want.
 */
declare const DashboardModal: React.ComponentType<DashboardModalProps>
export default DashboardModal
