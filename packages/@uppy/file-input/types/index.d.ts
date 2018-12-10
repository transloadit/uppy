import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module FileInput {
  interface FileInputOptions extends PluginOptions {
    pretty: boolean;
    inputName: string;
  }
}

declare class FileInput extends Plugin {
  constructor(uppy: Uppy, opts: Partial<FileInput.FileInputOptions>);
}

export = FileInput;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof FileInput, opts: Partial<FileInput.FileInputOptions>): Uppy;
  }
}
