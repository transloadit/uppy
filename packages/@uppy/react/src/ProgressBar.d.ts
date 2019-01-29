import { Uppy } from './CommonTypes';

export interface ProgressBarProps {
  uppy: Uppy;
  fixed?: boolean;
  hideAfterFinish?: boolean;
}

/**
 * React component that renders a progress bar at the top of the page.
 */
declare const ProgressBar: React.ComponentType<ProgressBarProps>;
export default ProgressBar;
