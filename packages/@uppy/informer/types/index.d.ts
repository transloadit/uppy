import Uppy = require('@uppy/core');

declare module Informer {
  interface Color {
    bg: string | number;
    text: string | number;
  }

  interface InformerOptions extends Uppy.PluginOptions {
    typeColors: {
      [type: string]: Color
    };
  }
}

declare class Informer extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<Informer.InformerOptions>);
}

export = Informer;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Informer, opts: Partial<Informer.InformerOptions>): Uppy.Uppy;
  }
}
