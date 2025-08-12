import prettierBytes from '@transloadit/prettier-bytes'
import type { DefinePluginOpts, PluginOpts } from '@uppy/core'
import { BasePlugin, type Uppy } from '@uppy/core'
import type { Body, Meta, UppyFile } from '@uppy/utils'
// @ts-ignore
import { getFileNameAndExtension, RateLimitedQueue } from '@uppy/utils'
import CompressorJS from 'compressorjs'

import locale from './locale.js'

declare module '@uppy/core' {
  export interface UppyEventMap<M extends Meta, B extends Body> {
    'compressor:complete': (file: UppyFile<M, B>[]) => void
  }
}

export interface CompressorOpts extends PluginOpts, CompressorJS.Options {
  limit?: number
}

export type { CompressorOpts as CompressorOptions }

const defaultOptions = {
  quality: 0.6,
  limit: 10,
} satisfies Partial<CompressorOpts>

export default class Compressor<
  M extends Meta,
  B extends Body,
> extends BasePlugin<
  DefinePluginOpts<CompressorOpts, keyof typeof defaultOptions>,
  M,
  B
> {
  #RateLimitedQueue

  constructor(uppy: Uppy<M, B>, opts?: CompressorOpts) {
    super(uppy, { ...defaultOptions, ...opts })
    this.id = this.opts.id || 'Compressor'
    this.type = 'modifier'

    this.defaultLocale = locale

    this.#RateLimitedQueue = new RateLimitedQueue(this.opts.limit)

    this.i18nInit()

    this.prepareUpload = this.prepareUpload.bind(this)
    this.compress = this.compress.bind(this)
  }

  compress(blob: Blob): Promise<Blob | File> {
    return new Promise((resolve, reject) => {
      new CompressorJS(blob, {
        ...this.opts,
        success: resolve,
        error: reject,
      })
    })
  }

  async prepareUpload(fileIDs: string[]): Promise<void> {
    let totalCompressedSize = 0
    const compressedFiles: UppyFile<M, B>[] = []
    const compressAndApplyResult = this.#RateLimitedQueue.wrapPromiseFunction(
      async (file: UppyFile<M, B>) => {
        try {
          const compressedBlob = await this.compress(file.data)
          const compressedSavingsSize = file.data.size - compressedBlob.size
          this.uppy.log(
            `[Image Compressor] Image ${file.id} compressed by ${prettierBytes(compressedSavingsSize)}`,
          )
          totalCompressedSize += compressedSavingsSize
          const { name, type, size } = compressedBlob as File

          const compressedFileName = getFileNameAndExtension(name)
          const metaFileName = getFileNameAndExtension(file.meta.name)

          // Name (file.meta.name) might have been changed by user, so we update only the extension
          const newMetaName = `${metaFileName.name}.${compressedFileName.extension}`

          this.uppy.setFileState(file.id, {
            ...(name && { name }),
            ...(compressedFileName.extension && {
              extension: compressedFileName.extension,
            }),
            ...(type && { type }),
            ...(size && { size }),
            data: compressedBlob,
            meta: {
              ...file.meta,
              type,
              name: newMetaName,
            },
          })
          compressedFiles.push(file)
        } catch (err) {
          this.uppy.log(
            `[Image Compressor] Failed to compress ${file.id}:`,
            'warning',
          )
          this.uppy.log(err, 'warning')
        }
      },
    )

    const promises = fileIDs.map((fileID) => {
      const file = this.uppy.getFile(fileID)
      this.uppy.emit('preprocess-progress', file, {
        mode: 'indeterminate',
        message: this.i18n('compressingImages'),
      })

      if (file.isRemote) {
        return Promise.resolve()
      }

      // Some browsers (Firefox) add blobs with empty file type, when files are
      // added from a folder. Uppy auto-detects type from extension, but leaves the original blob intact.
      // However, Compressor.js failes when file has no type, so we set it here
      if (!file.data.type) {
        file.data = file.data.slice(0, file.data.size, file.type)
      }

      if (!file.type?.startsWith('image/')) {
        return Promise.resolve()
      }

      return compressAndApplyResult(file)
    })

    // Why emit `preprocess-complete` for all files at once, instead of
    // above when each is processed?
    // Because it leads to StatusBar showing a weird “upload 6 files” button,
    // while waiting for all the files to complete pre-processing.
    await Promise.all(promises)

    this.uppy.emit('compressor:complete', compressedFiles)

    // Only show informer if Compressor mananged to save at least a kilobyte
    if (totalCompressedSize > 1024) {
      this.uppy.info(
        this.i18n('compressedX', {
          size: prettierBytes(totalCompressedSize),
        }),
        'info',
      )
    }

    for (const fileID of fileIDs) {
      const file = this.uppy.getFile(fileID)
      this.uppy.emit('preprocess-complete', file)
    }
  }

  install(): void {
    this.uppy.addPreProcessor(this.prepareUpload)
  }

  uninstall(): void {
    this.uppy.removePreProcessor(this.prepareUpload)
  }
}
