import type { PluginOptions, PluginTarget, BasePlugin } from '@uppy/core'

export interface FormOptions extends PluginOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    resultName?: string
    getMetaFromForm?: boolean
    addResultToForm?: boolean
    submitOnSuccess?: boolean
    triggerUploadOnSubmit?: boolean
}

declare class Form extends BasePlugin<FormOptions> {}

export default Form
