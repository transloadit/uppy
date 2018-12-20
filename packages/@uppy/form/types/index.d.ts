import Uppy = require('@uppy/core');

declare module Form {
  interface FormOptions extends Uppy.PluginOptions {
    getMetaFromForm: boolean;
    addResultToForm: boolean;
    submitOnSuccess: boolean;
    triggerUploadOnSubmit: boolean;
    resultName: string;
  }
}

declare class Form extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<Form.FormOptions>);
}

export = Form;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Form, opts: Partial<Form.FormOptions>): Uppy.Uppy;
  }
}
