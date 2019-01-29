import Uppy = require('@uppy/core');

declare module ThumbnailGenerator {
  interface ThumbnailGeneratorOptions extends Uppy.PluginOptions {
    thumbnailWidth: number;
  }
}

declare class ThumbnailGenerator extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<ThumbnailGenerator.ThumbnailGeneratorOptions>);
}

export = ThumbnailGenerator;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof ThumbnailGenerator, opts: Partial<ThumbnailGenerator.ThumbnailGeneratorOptions>): Uppy.Uppy;
  }
}
