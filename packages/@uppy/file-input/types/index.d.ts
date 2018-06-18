import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export interface FileInputOptions extends PluginOptions {
  pretty: boolean;
  inputName: string;
}

export default class FileInput extends Plugin {
  constructor(uppy: Uppy, opts: Partial<FileInputOptions>);
}
