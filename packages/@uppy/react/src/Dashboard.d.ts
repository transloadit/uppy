import { Uppy, Locale } from './CommonTypes';

interface MetaField {
  id: string;
  name: string;
  placeholder?: string;
}

export interface DashboardProps {
  uppy: Uppy;
  inline?: boolean;
  plugins?: Array<string>;
  trigger?: string;
  width?: number;
  height?: number;
  showLinkToFileUploadResult?: boolean;
  showProgressDetails?: boolean;
  hideUploadButton?: boolean;
  hideRetryButton?: boolean;
  hidePauseResumeButton?: boolean;
  hideCancelButton?: boolean;
  hideProgressAfterFinish?: boolean;
  showSelectedFiles?: boolean;
  note?: string;
  metaFields?: Array<MetaField>;
  proudlyDisplayPoweredByUppy?: boolean;
  disableStatusBar?: boolean;
  disableInformer?: boolean;
  disableThumbnailGenerator?: boolean;
  thumbnailWidth?: number;
  locale?: Locale;
}

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline; so you can put it anywhere you want.
 */
declare const Dashboard: React.ComponentType<DashboardProps>;
export default Dashboard;
