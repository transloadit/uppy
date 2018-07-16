import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export interface ReduxDevToolsOptions extends PluginOptions {
}

export default class ReduxDevTools extends Plugin {
  constructor(uppy: Uppy, opts: Partial<ReduxDevToolsOptions>);
}

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof ReduxDevTools, opts: Partial<ReduxDevToolsOptions>): Uppy;
  }
}
