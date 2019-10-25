import Uppy = require('@uppy/core');

declare module FileInput {
  interface FileInputOptions extends Uppy.PluginOptions {
    pretty?: boolean;
    inputName?: string;
  }
}

declare class FileInput extends Uppy.Plugin<FileInput.FileInputOptions> {}

export = FileInput;
