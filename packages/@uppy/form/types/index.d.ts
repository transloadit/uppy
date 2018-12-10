import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module Form {
  interface FormOptions extends PluginOptions {
    getMetaFromForm: boolean;
    addResultToForm: boolean;
    submitOnSuccess: boolean;
    triggerUploadOnSubmit: boolean;
    resultName: string;
  }
}

declare class Form extends Plugin {
  constructor(uppy: Uppy, opts: Partial<Form.FormOptions>);
}

export = Form;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Form, opts: Partial<Form.FormOptions>): Uppy;
  }
}
