import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/file-input' {
  export interface FileInputOptions extends PluginOptions {
    pretty: boolean;
    inputName: string;
  }

  export default class FileInput extends Plugin {
    constructor(uppy: Uppy, opts: Partial<FileInputOptions>);
  }
}
