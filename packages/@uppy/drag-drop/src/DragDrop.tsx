import type {
  Body,
  DefinePluginOpts,
  Meta,
  UIPluginOptions,
  Uppy,
} from '@uppy/core'
import { UIPlugin } from '@uppy/core'
import getDroppedFiles from '@uppy/utils/lib/getDroppedFiles'
import isDragDropSupported from '@uppy/utils/lib/isDragDropSupported'
import type { LocaleStrings } from '@uppy/utils/lib/Translator'
import toArray from '@uppy/utils/lib/toArray'
import { type ComponentChild, h } from 'preact'
import type { TargetedEvent } from 'preact/compat'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'

export interface DragDropOptions extends UIPluginOptions {
  inputName?: string
  allowMultipleFiles?: boolean
  width?: string | number
  height?: string | number
  note?: string
  onDragOver?: (event: DragEvent) => void
  onDragLeave?: (event: DragEvent) => void
  onDrop?: (event: DragEvent) => void
  locale?: LocaleStrings<typeof locale>
}

const defaultOptions = {
  inputName: 'files[]',
  width: '100%',
  height: '100%',
} satisfies Partial<DragDropOptions>

/**
 * Drag & Drop plugin
 *
 */
export default class DragDrop<M extends Meta, B extends Body> extends UIPlugin<
  DefinePluginOpts<DragDropOptions, keyof typeof defaultOptions>,
  M,
  B
> {
  static VERSION = packageJson.version

  // Check for browser dragDrop support
  private isDragDropSupported = isDragDropSupported()

  private fileInputRef!: HTMLInputElement

  constructor(uppy: Uppy<M, B>, opts?: DragDropOptions) {
    super(uppy, {
      ...defaultOptions,
      ...opts,
    })
    this.type = 'acquirer'
    this.id = this.opts.id || 'DragDrop'
    this.title = 'Drag & Drop'

    this.defaultLocale = locale

    this.i18nInit()
  }

  private addFiles = (files: File[]) => {
    const descriptors = files.map((file) => ({
      source: this.id,
      name: file.name,
      type: file.type,
      data: file,
      meta: {
        // path of the file relative to the ancestor directory the user selected.
        // e.g. 'docs/Old Prague/airbnb.pdf'
        relativePath: (file as any).relativePath || null,
      } as any as M,
    }))

    try {
      this.uppy.addFiles(descriptors)
    } catch (err) {
      this.uppy.log(err as any)
    }
  }

  private onInputChange = (event: TargetedEvent<HTMLInputElement, Event>) => {
    const files = toArray(event.currentTarget.files || [])
    if (files.length > 0) {
      this.uppy.log('[DragDrop] Files selected through input')
      this.addFiles(files)
    }

    // Clear the input so that Chrome can detect file section when the same file is repeatedly selected
    // (see https://github.com/transloadit/uppy/issues/768#issuecomment-2264902758)
    event.currentTarget.value = ''
  }

  private handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    // Check if the "type" of the datatransfer object includes files. If not, deny drop.
    const { types } = event.dataTransfer!
    const hasFiles = types.some((type) => type === 'Files')
    const { allowNewUpload } = this.uppy.getState()
    if (!hasFiles || !allowNewUpload) {
      event.dataTransfer!.dropEffect = 'none'
      return
    }

    // Add a small (+) icon on drop
    // (and prevent browsers from interpreting this as files being _moved_ into the browser
    // https://github.com/transloadit/uppy/issues/1978)
    //
    event.dataTransfer!.dropEffect = 'copy'

    this.setPluginState({ isDraggingOver: true })

    this.opts.onDragOver?.(event)
  }

  private handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    this.setPluginState({ isDraggingOver: false })

    this.opts.onDragLeave?.(event)
  }

  private handleDrop = async (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    this.setPluginState({ isDraggingOver: false })

    const logDropError = (error: any) => {
      this.uppy.log(error, 'error')
    }

    // Add all dropped files
    const files = await getDroppedFiles(event.dataTransfer!, { logDropError })
    if (files.length > 0) {
      this.uppy.log('[DragDrop] Files dropped')
      this.addFiles(files)
    }

    this.opts.onDrop?.(event)
  }

  private renderHiddenFileInput() {
    const { restrictions } = this.uppy.opts
    return (
      <input
        className="uppy-DragDrop-input"
        type="file"
        hidden
        ref={(ref) => {
          this.fileInputRef = ref!
        }}
        name={this.opts.inputName}
        multiple={restrictions.maxNumberOfFiles !== 1}
        accept={restrictions.allowedFileTypes?.join(', ')}
        onChange={this.onInputChange}
      />
    )
  }

  private static renderArrowSvg() {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        className="uppy-c-icon uppy-DragDrop-arrow"
        width="16"
        height="16"
        viewBox="0 0 16 16"
      >
        <path d="M11 10V0H5v10H2l6 6 6-6h-3zm0 0" fillRule="evenodd" />
      </svg>
    )
  }

  private renderLabel() {
    return (
      <div className="uppy-DragDrop-label">
        {this.i18nArray('dropHereOr', {
          browse: (
            <span className="uppy-DragDrop-browse">{this.i18n('browse')}</span>
          ) as any,
        })}
      </div>
    )
  }

  private renderNote() {
    return <span className="uppy-DragDrop-note">{this.opts.note}</span>
  }

  render(): ComponentChild {
    const dragDropClass = `uppy-u-reset
      uppy-DragDrop-container
      ${this.isDragDropSupported ? 'uppy-DragDrop--isDragDropSupported' : ''}
      ${this.getPluginState().isDraggingOver ? 'uppy-DragDrop--isDraggingOver' : ''}
    `

    const dragDropStyle = {
      width: this.opts.width,
      height: this.opts.height,
    }

    return (
      <button
        type="button"
        className={dragDropClass}
        style={dragDropStyle}
        onClick={() => this.fileInputRef.click()}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}
      >
        {this.renderHiddenFileInput()}
        <div className="uppy-DragDrop-inner">
          {DragDrop.renderArrowSvg()}
          {this.renderLabel()}
          {this.renderNote()}
        </div>
      </button>
    )
  }

  install(): void {
    const { target } = this.opts

    this.setPluginState({
      isDraggingOver: false,
    })

    if (target) {
      this.mount(target, this)
    }
  }

  uninstall(): void {
    this.unmount()
  }
}
