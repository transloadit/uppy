import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module ProgressBar {
  interface ProgressBarOptions extends PluginOptions {
    hideAfterFinish: boolean;
    fixed: boolean;
  }
}

declare class ProgressBar extends Plugin {
  constructor(uppy: Uppy, opts: Partial<ProgressBar.ProgressBarOptions>);
}

export = ProgressBar;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof ProgressBar, opts: Partial<ProgressBar.ProgressBarOptions>): Uppy;
  }
}
