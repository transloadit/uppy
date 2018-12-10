import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module DragDrop {
  interface DragDropOptions extends PluginOptions {
    inputName: string;
    allowMultipleFiles: boolean;
    width: string;
    height: string;
    note: string;
  }
}

declare class DragDrop extends Plugin {
  constructor(uppy: Uppy, opts: Partial<DragDrop.DragDropOptions>);
}

export = DragDrop;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof DragDrop, opts: Partial<DragDrop.DragDropOptions>): Uppy;
  }
}
