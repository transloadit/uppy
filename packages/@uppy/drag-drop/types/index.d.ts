import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export interface DragDropOptions extends PluginOptions {
  inputName: string;
  allowMultipleFiles: boolean;
  width: string;
  height: string;
  note: string;
}

export default class DragDrop extends Plugin {
  constructor(uppy: Uppy, opts: Partial<DragDropOptions>);
}
