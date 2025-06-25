import { BasePlugin } from '@uppy/core'
import type {
  DefinePluginOpts,
  UIPluginOptions,
  Uppy,
  UppyEventMap,
  Body,
  Meta,
} from '@uppy/core'
import findDOMElement from '@uppy/utils/lib/findDOMElement'
import toArray from '@uppy/utils/lib/toArray'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore untyped
import getFormData from 'get-form-data'

import packageJson from '../package.json' with { type: 'json' }

type Result<M extends Meta, B extends Body> = Parameters<
  UppyEventMap<M, B>['complete']
>[0]

export interface FormOptions extends UIPluginOptions {
  resultName?: string
  getMetaFromForm?: boolean
  addResultToForm?: boolean
  submitOnSuccess?: boolean
  triggerUploadOnSubmit?: boolean
}

const defaultOptions = {
  resultName: 'uppyResult',
  getMetaFromForm: true,
  addResultToForm: true,
  submitOnSuccess: false,
  triggerUploadOnSubmit: false,
}

type Opts = DefinePluginOpts<FormOptions, keyof typeof defaultOptions>

function assertHTMLFormElement(input: Node | null): HTMLFormElement {
  if (input == null || input.nodeName !== 'FORM') {
    throw new Error('ASSERTION FAILED: the target is not a <form> element', {
      cause: input,
    })
  }
  return input as any
}

export default class Form<M extends Meta, B extends Body> extends BasePlugin<
  Opts,
  M,
  B
> {
  static VERSION = packageJson.version

  #form!: HTMLFormElement

  constructor(uppy: Uppy<M, B>, opts?: FormOptions) {
    super(uppy, { ...defaultOptions, ...opts })
    this.type = 'acquirer'
    this.id = this.opts.id || 'Form'

    this.handleFormSubmit = this.handleFormSubmit.bind(this)
    this.handleUploadStart = this.handleUploadStart.bind(this)
    this.handleSuccess = this.handleSuccess.bind(this)
    this.addResultToForm = this.addResultToForm.bind(this)
    this.getMetaFromForm = this.getMetaFromForm.bind(this)
  }

  handleUploadStart(): void {
    if (this.opts.getMetaFromForm) {
      this.getMetaFromForm()
    }
  }

  handleSuccess(result: Result<M, B>): void {
    if (this.opts.addResultToForm) {
      this.addResultToForm(result)
    }

    if (this.opts.submitOnSuccess) {
      // Returns true if the element's child controls satisfy their validation constraints.
      // When false is returned, cancelable invalid events are fired for each invalid child
      // and validation problems are reported to the user.
      if (this.#form.reportValidity()) {
        this.#form.submit()
      }
    }
  }

  handleFormSubmit(ev: Event): void {
    if (this.opts.triggerUploadOnSubmit) {
      ev.preventDefault()
      const elements = toArray((ev.target as HTMLFormElement).elements)
      const disabledByUppy: HTMLButtonElement[] = []
      elements.forEach((el) => {
        const isButton =
          el.tagName === 'BUTTON' ||
          (el.tagName === 'INPUT' &&
            (el as HTMLButtonElement).type === 'submit')
        if (isButton && !(el as HTMLButtonElement).disabled) {
          ;(el as HTMLButtonElement).disabled = true // eslint-disable-line no-param-reassign
          disabledByUppy.push(el as HTMLButtonElement)
        }
      })
      this.uppy
        .upload()
        .then(
          () => {
            disabledByUppy.forEach((button) => {
              button.disabled = false // eslint-disable-line no-param-reassign
            })
          },
          (err) => {
            disabledByUppy.forEach((button) => {
              button.disabled = false // eslint-disable-line no-param-reassign
            })
            return Promise.reject(err)
          },
        )
        .catch((err) => {
          this.uppy.log(err.stack || err.message || err)
        })
    }
  }

  addResultToForm(result: Result<M, B>): void {
    this.uppy.log('[Form] Adding result to the original form:')
    this.uppy.log(result)

    let resultInput: HTMLInputElement | null = this.#form.querySelector(
      `[name="${this.opts.resultName}"]`,
    )
    if (resultInput) {
      // Append new result to the previous result array.
      // If the previous result is empty, or not an array,
      // set it to an empty array.
      let updatedResult
      try {
        updatedResult = JSON.parse(resultInput.value)
      } catch (err) {
        // Nothing, since we check for array below anyway
      }

      if (!Array.isArray(updatedResult)) {
        updatedResult = []
      }
      updatedResult.push(result)
      resultInput.value = JSON.stringify(updatedResult)
      return
    }

    resultInput = document.createElement('input')
    resultInput.name = this.opts.resultName
    resultInput.type = 'hidden'
    resultInput.value = JSON.stringify([result])

    this.#form.appendChild(resultInput)
  }

  getMetaFromForm(): void {
    const formMeta = getFormData(this.#form)
    // We want to exclude meta the the Form plugin itself has added
    // See https://github.com/transloadit/uppy/issues/1637
    delete formMeta[this.opts.resultName]
    this.uppy.setMeta(formMeta)
  }

  install(): void {
    this.#form = assertHTMLFormElement(findDOMElement(this.opts.target))

    this.#form.addEventListener('submit', this.handleFormSubmit)
    this.uppy.on('upload', this.handleUploadStart)
    this.uppy.on('complete', this.handleSuccess)
  }

  uninstall(): void {
    this.#form.removeEventListener('submit', this.handleFormSubmit)
    this.uppy.off('upload', this.handleUploadStart)
    this.uppy.off('complete', this.handleSuccess)
  }
}
