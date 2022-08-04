import { BasePlugin } from '@uppy/core'
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue'
import getFileNameAndExtension from '@uppy/utils/lib/getFileNameAndExtension'
import prettierBytes from '@transloadit/prettier-bytes'
import CompressorJS from 'compressorjs/dist/compressor.common.js'
import locale from './locale.js'

export default class Compressor extends BasePlugin {
  #RateLimitedQueue

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Compressor'
    this.type = 'modifier'

    this.defaultLocale = locale

    const defaultOptions = {
      quality: 0.6,
      limit: 10,
    }

    this.opts = { ...defaultOptions, ...opts }

    this.#RateLimitedQueue = new RateLimitedQueue(this.opts.limit)

    this.i18nInit()

    this.prepareUpload = this.prepareUpload.bind(this)
    this.compress = this.compress.bind(this)
  }

  compress (blob) {
    return new Promise((resolve, reject) => {
      /* eslint-disable no-new */
      new CompressorJS(blob, {
        ...this.opts,
        success: resolve,
        error: reject,
      })
    })
  }

  async prepareUpload (fileIDs) {
    let totalCompressedSize = 0
    const compressedFiles = []
    const compressAndApplyResult = this.#RateLimitedQueue.wrapPromiseFunction(
      async (file) => {
        try {
          const compressedBlob = await this.compress(file.data)
          const compressedSavingsSize = file.data.size - compressedBlob.size
          this.uppy.log(`[Image Compressor] Image ${file.id} compressed by ${prettierBytes(compressedSavingsSize)}`)
          totalCompressedSize += compressedSavingsSize
          const { name, type, size } = compressedBlob
          const extension = name && getFileNameAndExtension(name).extension
          this.uppy.setFileState(file.id, {
            ...(name && { name }),
            ...(extension && { extension }),
            ...(type && { type }),
            ...(size && { size }),
            data: compressedBlob,
          })
          this.uppy.setFileMeta(file.id, { type })
          compressedFiles.push(file)
        } catch (err) {
          this.uppy.log(`[Image Compressor] Failed to compress ${file.id}:`, 'warning')
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

      if (!file.type.startsWith('image/')) {
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

  install () {
    this.uppy.addPreProcessor(this.prepareUpload)
  }

  uninstall () {
    this.uppy.removePreProcessor(this.prepareUpload)
  }
}
