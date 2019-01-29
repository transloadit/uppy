import { Uppy, Locale } from './CommonTypes';

export interface DragDropProps {
  uppy: Uppy;
  locale?: Locale;
}

/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */
declare const DragDrop: React.ComponentType<DragDropProps>;
export default DragDrop;
