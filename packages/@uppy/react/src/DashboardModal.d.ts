import { DashboardProps } from './Dashboard';

export interface DashboardModalProps extends DashboardProps {
  target?: string | HTMLElement;
  open?: boolean;
  onRequestClose?: VoidFunction;
  closeModalOnClickOutside?: boolean;
  disablePageScrollWhenModalOpen?: boolean;
}

/**
 * React Component that renders a Dashboard for an Uppy instance in a Modal
 * dialog. Visibility of the Modal is toggled using the `open` prop.
 */
declare const DashboardModal: React.ComponentType<DashboardModalProps>;
export default DashboardModal;
