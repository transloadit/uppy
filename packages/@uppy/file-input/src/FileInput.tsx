import { h, type ComponentChild } from 'preact'

import { UIPlugin, Uppy, type UIPluginOptions } from '@uppy/core'
import toArray from '@uppy/utils/lib/toArray'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { DefinePluginOpts } from '@uppy/core/lib/BasePlugin.js'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'
import locale from './locale.ts'

export interface FileInputOptions extends UIPluginOptions {
  pretty?: boolean
  inputName?: string
}
// Default options, must be kept in sync with @uppy/react/src/FileInput.js.
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

  input: HTMLFileInputElement | null

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

  private handleInputChange(event: Event) {
    this.uppy.log('[FileInput] Something selected through input...')
    const files = toArray((event.target as HTMLFileInputElement).files)
    this.addFiles(files)

    // We clear the input after a file is selected, because otherwise
    // change event is not fired in Chrome and Safari when a file
    // with the same name is selected.
    // ___Why not use value="" on <input/> instead?
    //    Because if we use that method of clearing the input,
    //    Chrome will not trigger change if we drop the same file twice (Issue #768).
    // @ts-expect-error yes
    event.target.value = null // eslint-disable-line no-param-reassign
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
    } satisfies JSX.IntrinsicElements['input']['style']

    const { restrictions } = this.uppy.opts
    const accept =
      restrictions.allowedFileTypes ?
        restrictions.allowedFileTypes.join(',')
      : undefined

    return (
      <div className="uppy-FileInput-container">
        <input
          className="uppy-FileInput-input"
          style={this.opts.pretty ? hiddenInputStyle : undefined}
          type="file"
          name={this.opts.inputName}
          onChange={this.handleInputChange}
          multiple={restrictions.maxNumberOfFiles !== 1}
          accept={accept}
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
