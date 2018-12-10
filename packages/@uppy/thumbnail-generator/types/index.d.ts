import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module ThumbnailGenerator {
  interface ThumbnailGeneratorOptions extends PluginOptions {
    thumbnailWidth: number;
  }
}

declare class ThumbnailGenerator extends Plugin {
  constructor(uppy: Uppy, opts: Partial<ThumbnailGenerator.ThumbnailGeneratorOptions>);
}

export = ThumbnailGenerator;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof ThumbnailGenerator, opts: Partial<ThumbnailGenerator.ThumbnailGeneratorOptions>): Uppy;
  }
}
