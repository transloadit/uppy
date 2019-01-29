import Uppy = require('@uppy/core');

declare module ProgressBar {
  interface ProgressBarOptions extends Uppy.PluginOptions {
    hideAfterFinish: boolean;
    fixed: boolean;
  }
}

declare class ProgressBar extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<ProgressBar.ProgressBarOptions>);
}

export = ProgressBar;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof ProgressBar, opts: Partial<ProgressBar.ProgressBarOptions>): Uppy.Uppy;
  }
}
