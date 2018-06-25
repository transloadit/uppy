import { Plugin, PluginOptions, Uppy } from '@uppy/core';

interface Color {
  bg: string | number;
  text: string | number;
}

export interface InformerOptions extends PluginOptions {
  typeColors: {
    [type: string]: Color
  };
}

export default class Informer extends Plugin {
  constructor(uppy: Uppy, opts: Partial<InformerOptions>);
}
