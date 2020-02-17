import { DashboardProps } from './Dashboard'

export interface DashboardModalProps extends DashboardProps {
  open?: boolean
  onRequestClose?: VoidFunction
}

/**
 * React Component that renders a Dashboard for an Uppy instance in a Modal
 * dialog. Visibility of the Modal is toggled using the `open` prop.
 */
declare const DashboardModal: React.ComponentType<DashboardModalProps>
export default DashboardModal
