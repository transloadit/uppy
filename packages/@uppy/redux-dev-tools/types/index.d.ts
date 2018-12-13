import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module ReduxDevTools {
  interface ReduxDevToolsOptions extends PluginOptions {
  }
}

declare class ReduxDevTools extends Plugin {
  constructor(uppy: Uppy, opts: Partial<ReduxDevTools.ReduxDevToolsOptions>);
}

export = ReduxDevTools;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof ReduxDevTools, opts: Partial<ReduxDevTools.ReduxDevToolsOptions>): Uppy;
  }
}
