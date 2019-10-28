import Uppy = require('@uppy/core')

declare module Form {
  interface FormOptions extends Uppy.PluginOptions {
    target?: Uppy.PluginTarget
    getMetaFromForm?: boolean
    addResultToForm?: boolean
    submitOnSuccess?: boolean
    triggerUploadOnSubmit?: boolean
    resultName?: string
  }
}

declare class Form extends Uppy.Plugin<Form.FormOptions> {}

export = Form
