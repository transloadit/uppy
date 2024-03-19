import { UIPlugin, type Uppy } from '@uppy/core'
import type { DefinePluginOpts } from '@uppy/core/lib/BasePlugin.ts'
import type { UIPluginOptions } from '@uppy/core/lib/UIPlugin.ts'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { ChangeEvent } from 'preact/compat'
import toArray from '@uppy/utils/lib/toArray'
import isDragDropSupported from '@uppy/utils/lib/isDragDropSupported'
import getDroppedFiles from '@uppy/utils/lib/getDroppedFiles'
import { h, type ComponentChild } from 'preact'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'
import locale from './locale.ts'

export interface DragDropOptions extends UIPluginOptions {
  inputName?: string
  allowMultipleFiles?: boolean
  width?: string | number
  height?: string | number
  note?: string
  onDragOver?: (event: DragEvent) => void
  onDragLeave?: (event: DragEvent) => void
  onDrop?: (event: DragEvent) => void
}

// Default options, must be kept in sync with @uppy/react/src/DragDrop.js.
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

  private removeDragOverClassTimeout: ReturnType<typeof setTimeout>

  private fileInputRef: HTMLInputElement

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
      this.uppy.log(err)
    }
  }

  private onInputChange = (event: ChangeEvent) => {
    const files = toArray((event.target as HTMLInputElement).files!)
    if (files.length > 0) {
      this.uppy.log('[DragDrop] Files selected through input')
      this.addFiles(files)
    }

    // We clear the input after a file is selected, because otherwise
    // change event is not fired in Chrome and Safari when a file
    // with the same name is selected.
    // ___Why not use value="" on <input/> instead?
    //    Because if we use that method of clearing the input,
    //    Chrome will not trigger change if we drop the same file twice (Issue #768).
    // @ts-expect-error TS freaks out, but this is fine
    // eslint-disable-next-line no-param-reassign
    event.target.value = null
  }

  private handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    // Check if the "type" of the datatransfer object includes files. If not, deny drop.
    const { types } = event.dataTransfer!
    const hasFiles = types.some((type) => type === 'Files')
    const { allowNewUpload } = this.uppy.getState()
    if (!hasFiles || !allowNewUpload) {
      // eslint-disable-next-line no-param-reassign
      event.dataTransfer!.dropEffect = 'none'
      clearTimeout(this.removeDragOverClassTimeout)
      return
    }

    // Add a small (+) icon on drop
    // (and prevent browsers from interpreting this as files being _moved_ into the browser
    // https://github.com/transloadit/uppy/issues/1978)
    //
    // eslint-disable-next-line no-param-reassign
    event.dataTransfer!.dropEffect = 'copy'

    clearTimeout(this.removeDragOverClassTimeout)
    this.setPluginState({ isDraggingOver: true })

    this.opts.onDragOver?.(event)
  }

  private handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    clearTimeout(this.removeDragOverClassTimeout)
    // Timeout against flickering, this solution is taken from drag-drop library.
    // Solution with 'pointer-events: none' didn't work across browsers.
    this.removeDragOverClassTimeout = setTimeout(() => {
      this.setPluginState({ isDraggingOver: false })
    }, 50)

    this.opts.onDragLeave?.(event)
  }

  private handleDrop = async (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    clearTimeout(this.removeDragOverClassTimeout)

    // Remove dragover class
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
        // @ts-expect-error We actually want to coerce the array to a string (or keep it as null/undefined)
        accept={restrictions.allowedFileTypes}
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
