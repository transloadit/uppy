import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/redux-dev-tools' {
  export interface ReduxDevToolsOptions extends PluginOptions {
  }

  export default class ReduxDevTools extends Plugin {
    constructor(uppy: Uppy, opts: Partial<ReduxDevToolsOptions>);
  }
}
