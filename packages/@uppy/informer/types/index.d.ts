import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module Informer {
  interface Color {
    bg: string | number;
    text: string | number;
  }

  interface InformerOptions extends PluginOptions {
    typeColors: {
      [type: string]: Color
    };
  }
}

declare class Informer extends Plugin {
  constructor(uppy: Uppy, opts: Partial<Informer.InformerOptions>);
}

export = Informer;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Informer, opts: Partial<Informer.InformerOptions>): Uppy;
  }
}
