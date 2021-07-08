import Uppy = require('@uppy/core')

declare module Form {
  interface FormOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    resultName?: string
    getMetaFromForm?: boolean
    addResultToForm?: boolean
    submitOnSuccess?: boolean
    triggerUploadOnSubmit?: boolean
  }
}

declare class Form extends Uppy.Plugin<Form.FormOptions> {}

export = Form
