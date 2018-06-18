import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export interface ReduxDevToolsOptions extends PluginOptions {
}

export default class ReduxDevTools extends Plugin {
  constructor(uppy: Uppy, opts: Partial<ReduxDevToolsOptions>);
}
