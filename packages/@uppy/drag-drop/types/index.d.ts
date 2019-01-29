import Uppy = require('@uppy/core');

declare module DragDrop {
  interface DragDropOptions extends Uppy.PluginOptions {
    inputName: string;
    allowMultipleFiles: boolean;
    width: string;
    height: string;
    note: string;
  }
}

declare class DragDrop extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<DragDrop.DragDropOptions>);
}

export = DragDrop;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof DragDrop, opts: Partial<DragDrop.DragDropOptions>): Uppy.Uppy;
  }
}
