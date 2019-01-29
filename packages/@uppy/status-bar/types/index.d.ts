import Uppy = require('@uppy/core');

declare module StatusBar {
  export interface StatusBarOptions extends Uppy.PluginOptions {
    showProgressDetails: boolean;
    hideUploadButton: boolean;
    hideAfterFinish: boolean;
  }
}

declare class StatusBar extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<StatusBar.StatusBarOptions>);
}

export = StatusBar;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof StatusBar, opts: Partial<StatusBar.StatusBarOptions>): Uppy.Uppy;
  }
}
