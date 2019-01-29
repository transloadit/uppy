import Uppy = require('@uppy/core');

declare module ReduxDevTools {
  interface ReduxDevToolsOptions extends Uppy.PluginOptions {
  }
}

declare class ReduxDevTools extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<ReduxDevTools.ReduxDevToolsOptions>);
}

export = ReduxDevTools;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof ReduxDevTools, opts: Partial<ReduxDevTools.ReduxDevToolsOptions>): Uppy.Uppy;
  }
}
