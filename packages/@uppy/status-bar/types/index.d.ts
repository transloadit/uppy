import Uppy = require('@uppy/core');

declare module StatusBar {
  export interface StatusBarOptions extends Uppy.PluginOptions {
    showProgressDetails?: boolean;
    hideUploadButton?: boolean;
    hideAfterFinish?: boolean;
  }
}

declare class StatusBar extends Uppy.Plugin<StatusBar.StatusBarOptions> {}

export = StatusBar;
