import { Uppy } from './CommonTypes';

export interface StatusBarProps {
  uppy: Uppy;
  showProgressDetails?: boolean;
  hideAfterFinish?: boolean;
}

/**
 * React component that renders a status bar containing upload progress and speed,
 * processing progress and pause/resume/cancel controls.
 */
declare const StatusBar: React.ComponentType<StatusBarProps>;
export default StatusBar;
