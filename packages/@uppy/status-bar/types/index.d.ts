import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module StatusBar {
  export interface StatusBarOptions extends PluginOptions {
    showProgressDetails: boolean;
    hideUploadButton: boolean;
    hideAfterFinish: boolean;
  }
}

declare class StatusBar extends Plugin {
  constructor(uppy: Uppy, opts: Partial<StatusBar.StatusBarOptions>);
}

export = StatusBar;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof StatusBar, opts: Partial<StatusBar.StatusBarOptions>): Uppy;
  }
}
