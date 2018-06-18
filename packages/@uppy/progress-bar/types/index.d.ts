import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/progress-bar' {
  export interface ProgressBarOptions extends PluginOptions {
    hideAfterFinish: boolean;
    fixed: boolean;
  }

  export default class ProgressBar extends Plugin {
    constructor(uppy: Uppy, opts: Partial<ProgressBarOptions>);
  }
}
