import Uppy = require('@uppy/core');

declare module FileInput {
  interface FileInputOptions extends Uppy.PluginOptions {
    pretty: boolean;
    inputName: string;
  }
}

declare class FileInput extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<FileInput.FileInputOptions>);
}

export = FileInput;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof FileInput, opts: Partial<FileInput.FileInputOptions>): Uppy.Uppy;
  }
}
