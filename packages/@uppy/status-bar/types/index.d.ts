import Uppy = require('@uppy/core')

declare module StatusBar {
  export type StatusBarLocale = Uppy.Locale<
    | 'uploading'
    | 'upload'
    | 'complete'
    | 'uploadFailed'
    | 'paused'
    | 'retry'
    | 'cancel'
    | 'pause'
    | 'resume'
    | 'filesUploadedOfTotal'
    | 'dataUploadedOfTotal'
    | 'xTimeLeft'
    | 'uploadXFiles'
    | 'uploadXNewFiles'
    | 'xMoreFilesAdded'
  >

  export interface StatusBarOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    showProgressDetails?: boolean
    hideUploadButton?: boolean
    hideAfterFinish?: boolean
    locale?: StatusBarLocale
  }
}

declare class StatusBar extends Uppy.Plugin<StatusBar.StatusBarOptions> {}

export = StatusBar
