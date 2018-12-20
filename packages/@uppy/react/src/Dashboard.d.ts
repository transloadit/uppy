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
  width?: number;
  height?: number;
  showProgressDetails?: boolean;
  showLinkToFileUploadResult?: boolean;
  hideUploadButton?: boolean;
  hideProgressAfterFinish?: boolean;
  note?: string;
  metaFields?: Array<MetaField>;
  proudlyDisplayPoweredByUppy?: boolean;
  disableStatusBar?: boolean;
  disableInformer?: boolean;
  disableThumbnailGenerator?: boolean;
  locale?: Locale;
}

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline; so you can put it anywhere you want.
 */
declare const Dashboard: React.ComponentType<DashboardProps>;
export default Dashboard;
