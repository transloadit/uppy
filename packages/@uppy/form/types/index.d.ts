import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export interface FormOptions extends PluginOptions {
  getMetaFromForm: boolean;
  addResultToForm: boolean;
  submitOnSuccess: boolean;
  triggerUploadOnSubmit: boolean;
  resultName: string;
}

export default class Form extends Plugin {
  constructor(uppy: Uppy, opts: Partial<FormOptions>);
}
