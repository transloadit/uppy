import Uppy = require('@uppy/core');

declare module ThumbnailGenerator {
  interface ThumbnailGeneratorOptions extends Uppy.PluginOptions {
    thumbnailWidth?: number;
  }
}

declare class ThumbnailGenerator extends Uppy.Plugin<ThumbnailGenerator.ThumbnailGeneratorOptions> {}

export = ThumbnailGenerator;
