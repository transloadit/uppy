import type { Body, DefinePluginOpts, Meta, PluginOpts, Uppy } from '@uppy/core'
import { BasePlugin } from '@uppy/core'
import { getDroppedFiles, toArray } from '@uppy/utils'
import packageJson from '../package.json' with { type: 'json' }

export interface DropTargetOptions extends PluginOpts {
  target?: HTMLElement | string | null
  onDrop?: (event: DragEvent) => void
  onDragOver?: (event: DragEvent) => void
  onDragLeave?: (event: DragEvent) => void
}

// Default options
const defaultOpts = {
  target: null,
} satisfies DropTargetOptions

interface DragEventWithFileTransfer extends DragEvent {
  dataTransfer: NonNullable<DragEvent['dataTransfer']>
}

function isFileTransfer(event: DragEvent): event is DragEventWithFileTransfer {
  return event.dataTransfer?.types?.some((type) => type === 'Files') ?? false
}

/**
 * Drop Target plugin
 *
 */
export default class DropTarget<
  M extends Meta,
  B extends Body,
> extends BasePlugin<
  DefinePluginOpts<DropTargetOptions, keyof typeof defaultOpts>,
  M,
  B
> {
  static VERSION = packageJson.version

  private nodes?: Array<HTMLElement>

  constructor(uppy: Uppy<M, B>, opts?: DropTargetOptions) {
    super(uppy, { ...defaultOpts, ...opts })
    this.type = 'acquirer'
    this.id = this.opts.id || 'DropTarget'
  }

  addFiles = (files: Array<File>): void => {
    const descriptors = files.map((file) => ({
      source: this.id,
      name: file.name,
      type: file.type,
      data: file,
      meta: {
        // path of the file relative to the ancestor directory the user selected.
        // e.g. 'docs/Old Prague/airbnb.pdf'
        relativePath: (file as any).relativePath || null,
      } as any,
    }))

    try {
      this.uppy.addFiles(descriptors)
    } catch (err) {
      this.uppy.log(err)
    }
  }

  handleDrop = async (event: DragEvent): Promise<void> => {
    if (!isFileTransfer(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    // Remove dragover class
    ;(event.currentTarget as HTMLElement)?.classList.remove('uppy-is-drag-over')
    this.setPluginState({ isDraggingOver: false })

    // Let any acquirer plugin (Url/Webcam/etc.) handle drops to the root
    this.uppy.iteratePlugins((plugin) => {
      if (plugin.type === 'acquirer') {
        // @ts-expect-error Every Plugin with .type acquirer can define handleRootDrop(event)
        plugin.handleRootDrop?.(event)
      }
    })

    // Add all dropped files, handle errors
    let executedDropErrorOnce = false
    const logDropError = (error: Error): void => {
      this.uppy.log(error, 'error')

      // In practice all drop errors are most likely the same,
      // so let's just show one to avoid overwhelming the user
      if (!executedDropErrorOnce) {
        this.uppy.info(error.message, 'error')
        executedDropErrorOnce = true
      }
    }

    const files = await getDroppedFiles(event.dataTransfer, { logDropError })
    if (files.length > 0) {
      this.uppy.log('[DropTarget] Files were dropped')
      this.addFiles(files)
    }

    this.opts.onDrop?.(event)
  }

  handleDragOver = (event: DragEvent): void => {
    if (!isFileTransfer(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    // Add a small (+) icon on drop
    // (and prevent browsers from interpreting this as files being _moved_ into the browser,
    // https://github.com/transloadit/uppy/issues/1978)
    event.dataTransfer.dropEffect = 'copy'
    ;(event.currentTarget as HTMLElement).classList.add('uppy-is-drag-over')
    this.setPluginState({ isDraggingOver: true })
    this.opts.onDragOver?.(event)
  }

  handleDragLeave = (event: DragEvent): void => {
    if (!isFileTransfer(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    this.setPluginState({ isDraggingOver: false })
    ;(event.currentTarget as HTMLElement)?.classList.remove('uppy-is-drag-over')

    this.opts.onDragLeave?.(event)
  }

  addListeners = (): void => {
    const { target } = this.opts

    if (target instanceof Element) {
      this.nodes = [target]
    } else if (typeof target === 'string') {
      this.nodes = toArray(document.querySelectorAll(target))
    }

    if (!this.nodes || this.nodes.length === 0) {
      throw new Error(`"${target}" does not match any HTML elements`)
    }

    this.nodes.forEach((node) => {
      node.addEventListener('dragover', this.handleDragOver, false)
      node.addEventListener('dragleave', this.handleDragLeave, false)
      node.addEventListener('drop', this.handleDrop, false)
    })
  }

  removeListeners = (): void => {
    if (this.nodes) {
      this.nodes.forEach((node) => {
        node.removeEventListener('dragover', this.handleDragOver, false)
        node.removeEventListener('dragleave', this.handleDragLeave, false)
        node.removeEventListener('drop', this.handleDrop, false)
      })
    }
  }

  install(): void {
    this.setPluginState({ isDraggingOver: false })
    this.addListeners()
  }

  uninstall(): void {
    this.removeListeners()
  }
}
