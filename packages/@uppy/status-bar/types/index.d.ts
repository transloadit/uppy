import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export interface StatusBarOptions extends PluginOptions {
  showProgressDetails: boolean;
  hideUploadButton: boolean;
  hideAfterFinish: boolean;
}

export default class StatusBar extends Plugin {
  constructor(uppy: Uppy, opts: Partial<StatusBarOptions>);
}

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof StatusBar, opts: Partial<StatusBarOptions>): Uppy;
  }
}
