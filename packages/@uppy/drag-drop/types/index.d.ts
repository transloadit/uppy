import Uppy = require('@uppy/core');

declare module DragDrop {
  interface DragDropOptions extends Uppy.PluginOptions {
    inputName?: string;
    allowMultipleFiles?: boolean;
    width?: string;
    height?: string;
    note?: string;
  }
}

declare class DragDrop extends Uppy.Plugin<DragDrop.DragDropOptions> {}

export = DragDrop;
