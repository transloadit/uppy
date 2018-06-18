import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/thumbnail-generator' {
  export interface ThumbnailGeneratorOptions extends PluginOptions {
    thumbnailWidth: number;
  }

  export default class ThumbnailGenerator extends Plugin {
    constructor(uppy: Uppy, opts: Partial<ThumbnailGeneratorOptions>);
  }
}
