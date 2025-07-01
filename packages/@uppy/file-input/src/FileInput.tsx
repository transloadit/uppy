import type {
  Body,
  DefinePluginOpts,
  Meta,
  UIPluginOptions,
  Uppy,
} from '@uppy/core'

import { UIPlugin } from '@uppy/core'
import type { LocaleStrings } from '@uppy/utils/lib/Translator'
import toArray from '@uppy/utils/lib/toArray'
// biome-ignore lint/style/useImportType: h is not a type
import { type ComponentChild, h } from 'preact'
import type { TargetedEvent } from 'preact/compat'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'

export interface FileInputOptions extends UIPluginOptions {
  pretty?: boolean
  inputName?: string
  locale?: LocaleStrings<typeof locale>
}
const defaultOptions = {
  pretty: true,
  inputName: 'files[]',
}

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/files
interface HTMLFileInputElement extends HTMLInputElement {
  files: FileList
}

type Opts = DefinePluginOpts<FileInputOptions, keyof typeof defaultOptions>

export default class FileInput<M extends Meta, B extends Body> extends UIPlugin<
  Opts,
  M,
  B
> {
  static VERSION = packageJson.version

  input: HTMLFileInputElement | null = null

  constructor(uppy: Uppy<M, B>, opts?: FileInputOptions) {
    super(uppy, { ...defaultOptions, ...opts })
    this.id = this.opts.id || 'FileInput'
    this.title = 'File Input'
    this.type = 'acquirer'

    this.defaultLocale = locale

    this.i18nInit()

    this.render = this.render.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  addFiles(files: File[]): void {
    const descriptors = files.map((file) => ({
      source: this.id,
      name: file.name,
      type: file.type,
      data: file,
    }))

    try {
      this.uppy.addFiles(descriptors)
    } catch (err) {
      this.uppy.log(err)
    }
  }

  private handleInputChange(event: TargetedEvent<HTMLInputElement, Event>) {
    this.uppy.log('[FileInput] Something selected through input...')
    const files = toArray(event.currentTarget.files || [])
    this.addFiles(files)

    // Clear the input so that Chrome can detect file section when the same file is repeatedly selected
    // (see https://github.com/transloadit/uppy/issues/768#issuecomment-2264902758)
    event.currentTarget.value = ''
  }

  private handleClick() {
    this.input!.click()
  }

  render(): ComponentChild {
    /* http://tympanus.net/codrops/2015/09/15/styling-customizing-file-inputs-smart-way/ */
    const hiddenInputStyle = {
      width: '0.1px',
      height: '0.1px',
      opacity: 0,
      overflow: 'hidden',
      position: 'absolute',
      zIndex: -1,
    } satisfies h.JSX.IntrinsicElements['input']['style']

    const { restrictions } = this.uppy.opts

    return (
      <div className="uppy-FileInput-container">
        <input
          className="uppy-FileInput-input"
          style={this.opts.pretty ? hiddenInputStyle : undefined}
          type="file"
          name={this.opts.inputName}
          onChange={this.handleInputChange}
          multiple={restrictions.maxNumberOfFiles !== 1}
          accept={restrictions.allowedFileTypes?.join(', ')}
          ref={(input) => {
            this.input = input as HTMLFileInputElement
          }}
        />
        {this.opts.pretty && (
          <button
            className="uppy-FileInput-btn"
            type="button"
            onClick={this.handleClick}
          >
            {this.i18n('chooseFiles')}
          </button>
        )}
      </div>
    )
  }

  install(): void {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall(): void {
    this.unmount()
  }
}
