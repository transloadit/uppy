import type { Meta } from '@uppy/core/utils'

import Uppy, { UIPlugin } from '@uppy/core'
import { delay } from '@uppy/core/utils'
import ThumbnailGeneratorPlugin from '@uppy/thumbnail-generator'
import { describe, expect, it, vi } from 'vitest'

describe('uploader/ThumbnailGeneratorPlugin', () => {
  it('should initialise successfully', () => {
    using uppy = new Uppy()
    const plugin = new ThumbnailGeneratorPlugin(uppy, {})
    expect(plugin instanceof UIPlugin).toEqual(true)
  })

  it('should accept the thumbnailWidth and thumbnailHeight option and override the default', () => {
    using uppy1 = new Uppy()
    const plugin1 = new ThumbnailGeneratorPlugin(uppy1)
    expect(plugin1.opts.thumbnailWidth).toEqual(null)
    expect(plugin1.opts.thumbnailHeight).toEqual(null)

    using uppy2 = new Uppy()
    const plugin2 = new ThumbnailGeneratorPlugin(uppy2, {
      thumbnailWidth: 100,
    })
    expect(plugin2.opts.thumbnailWidth).toEqual(100)

    using uppy3 = new Uppy()
    const plugin3 = new ThumbnailGeneratorPlugin(uppy3, {
      thumbnailHeight: 100,
    })
    expect(plugin3.opts.thumbnailHeight).toEqual(100)
  })

  describe('install', () => {
    it('should subscribe to uppy file-added event', () => {
      using uppy = new Uppy()
      const core = Object.assign(uppy, {
        on: vi.fn(),
      })

      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.addToQueue = vi.fn()
      plugin.install()

      expect(core.on).toHaveBeenCalledTimes(5)
      expect(core.on).toHaveBeenCalledWith('file-added', plugin.onFileAdded)
    })
  })

  describe('uninstall', () => {
    it('should unsubscribe from uppy file-added event', () => {
      using core = new Uppy()
      vi.spyOn(core, 'on')
      vi.spyOn(core, 'off')

      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.addToQueue = vi.fn()
      plugin.install()

      expect(core.on).toHaveBeenCalledTimes(5)

      plugin.uninstall()

      expect(core.off).toHaveBeenCalledTimes(5)
      expect(core.off).toHaveBeenCalledWith('file-added', plugin.onFileAdded)
    })
  })

  describe('queue', () => {
    it('should add a new file to the queue and start processing the queue when queueProcessing is false', () => {
      using uppy = new Uppy()
      const plugin = new ThumbnailGeneratorPlugin(uppy)
      plugin.processQueue = vi.fn()

      const file = { id: 'bar', type: 'image/jpeg' }
      plugin.queueProcessing = false
      plugin.addToQueue(file.id)
      expect(plugin.queue).toEqual(['bar'])
      expect(plugin.processQueue).toHaveBeenCalledTimes(1)

      const file2 = { id: 'bar2', type: 'image/jpeg' }
      plugin.queueProcessing = true
      plugin.addToQueue(file2.id)
      expect(plugin.queue).toEqual(['bar', 'bar2'])
      expect(plugin.processQueue).toHaveBeenCalledTimes(1)
    })

    it('should process items in the queue one by one', async () => {
      const core = new Uppy()
      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.requestThumbnail = vi.fn(() => delay(100))
      plugin.install()

      const fileId1 = core.addFile({
        name: 'bar.jpeg',
        type: 'image/jpeg',
        data: new Blob(),
      })
      const fileId2 = core.addFile({
        name: 'bar2.jpeg',
        type: 'image/jpeg',
        data: new Blob(),
      })
      const fileId3 = core.addFile({
        name: 'bar3.jpeg',
        type: 'image/jpeg',
        data: new Blob(),
      })

      expect(plugin.requestThumbnail).toHaveBeenCalledTimes(1)
      expect(plugin.requestThumbnail).toHaveBeenCalledWith(
        core.getFile(fileId1),
      )

      await delay(110)
      expect(plugin.requestThumbnail).toHaveBeenCalledTimes(2)
      expect(plugin.requestThumbnail).toHaveBeenCalledWith(
        core.getFile(fileId2),
      )
      await delay(110)
      expect(plugin.requestThumbnail).toHaveBeenCalledTimes(3)
      expect(plugin.requestThumbnail).toHaveBeenCalledWith(
        core.getFile(fileId3),
      )
      await delay(110)
      expect(plugin.queue).toEqual([])
      expect(plugin.queueProcessing).toEqual(false)
    })

    it('should revoke object URLs when files are removed', async () => {
      using core = new Uppy()
      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.install()

      vi.spyOn(URL, 'revokeObjectURL')
      vi.spyOn(plugin, 'createThumbnail')

      const fileId1 = core.addFile({
        name: 'bar.jpg',
        type: 'image/jpeg',
        data: new Blob(),
      })
      const fileId2 = core.addFile({
        name: 'bar2.jpg',
        type: 'image/jpeg',
        data: new Blob(),
      })
      expect(plugin.queue).toHaveLength(1)
      // should drop it from the queue
      core.removeFile(fileId2)
      expect(plugin.queue).toHaveLength(0)

      expect(plugin.createThumbnail).toHaveBeenCalledTimes(1)
      expect(URL.revokeObjectURL).not.toHaveBeenCalled()

      await delay(110)

      core.removeFile(fileId1)
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    })
  })

  describe('events', () => {
    it('should emit thumbnail:generated when a thumbnail was generated', async () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      vi.spyOn(plugin, 'createThumbnail').mockResolvedValue('thumbnail')
      const listener = vi.fn()

      core.on('thumbnail:generated', listener)

      const fileId = core.addFile({
        name: 'bar',
        type: 'image/png',
        data: new Blob(['PNG']),
      })
      await delay(0)
      const file = core.getFile(fileId)

      expect(listener).toHaveBeenCalledExactlyOnceWith(
        file,
        'thumbnail',
        undefined,
        undefined,
        undefined,
        undefined,
      )
    })

    it('should emit thumbnail:all-generated when all thumbnails were generated', async () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      vi.spyOn(plugin, 'createThumbnail').mockResolvedValue('thumbnail')
      const listener = vi.fn()

      core.on('thumbnail:all-generated', listener)

      core.addFile({
        name: 'bar1',
        type: 'image/png',
        data: new Blob(['PNG']),
      })
      core.addFile({
        name: 'bar2',
        type: 'image/png',
        data: new Blob(['PNG']),
      })
      await delay(0)

      expect(listener).toHaveBeenCalledOnce()
    })
  })

  describe('requestThumbnail', () => {
    it('should call createThumbnail if it is a supported filetype', () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      vi.spyOn(plugin, 'createThumbnail').mockResolvedValue('preview')

      const fileId = core.addFile({
        type: 'image/png',
        isRemote: false,
        data: new Blob(),
      })
      const file = core.getFile(fileId)

      expect(plugin.createThumbnail).toHaveBeenCalledTimes(1)
      expect(plugin.createThumbnail).toHaveBeenCalledWith(
        file,
        plugin.opts.thumbnailWidth,
        plugin.opts.thumbnailHeight,
      )
    })

    it('should not call createThumbnail if it is not a supported filetype', () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      vi.spyOn(plugin, 'createThumbnail').mockResolvedValue('preview')

      core.addFile({
        type: 'text/html',
        isRemote: false,
        data: new Blob(),
      })

      expect(plugin.createThumbnail).not.toHaveBeenCalled()
    })

    it('should not call createThumbnail if the file is remote', () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      vi.spyOn(plugin, 'createThumbnail')

      core.addFile({
        type: 'text/html',
        isRemote: true,
        data: new Blob(),
      })

      expect(plugin.createThumbnail).not.toHaveBeenCalled()
    })

    it('should call setPreviewURL with the thumbnail image', async () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      vi.spyOn(plugin, 'createThumbnail').mockResolvedValue('preview')
      vi.spyOn(plugin, 'setPreviewURL')

      const fileId = core.addFile({
        type: 'text/png',
        data: new Blob(),
      })
      await delay(0)

      expect(plugin.setPreviewURL).toHaveBeenCalledTimes(1)
      expect(plugin.setPreviewURL).toHaveBeenCalledWith(fileId, 'preview')
    })
  })

  describe('setPreviewURL', () => {
    it('should update the preview url for the specified image', () => {
      using core = new Uppy()
      const fileId = core.addFile({
        type: 'text/png',
        data: new Blob(),
      })

      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      plugin.setPreviewURL(fileId, 'moo')
      expect(core.getFile(fileId).preview).toBe('moo')
    })
  })

  describe('getProportionalDimensions', () => {
    it('should calculate the thumbnail dimensions based on the width whilst keeping aspect ratio', () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      expect(
        plugin.getProportionalDimensions(new Image(200, 100), 50, null),
      ).toEqual({
        width: 50,
        height: 25,
      })
      expect(
        plugin.getProportionalDimensions(new Image(66, 66), 33, null),
      ).toEqual({
        width: 33,
        height: 33,
      })
      expect(
        plugin.getProportionalDimensions(new Image(201.2, 198.2), 47, null),
      ).toEqual({
        width: 47,
        height: 46,
      })
    })

    it('should calculate the thumbnail dimensions based on the height whilst keeping aspect ratio', () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      expect(
        plugin.getProportionalDimensions(new Image(200, 100), null, 50),
      ).toEqual({
        width: 100,
        height: 50,
      })
      expect(
        plugin.getProportionalDimensions(new Image(66, 66), null, 33),
      ).toEqual({
        width: 33,
        height: 33,
      })
      expect(
        plugin.getProportionalDimensions(new Image(201.2, 198.2), null, 47),
      ).toEqual({ width: 48, height: 47 })
    })

    it('should calculate the thumbnail dimensions based on the default width if no custom width is given', () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin, {})
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      expect(
        plugin.getProportionalDimensions(new Image(2, 1), null, null),
      ).toEqual({
        width: 200,
        height: 100,
      })
    })

    it('should calculate the thumbnail dimensions based on the width if both width and height are given', () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin, {})
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      expect(
        plugin.getProportionalDimensions(new Image(200, 100), 50, 42),
      ).toEqual({
        width: 50,
        height: 25,
      })
    })
  })

  describe('resizeImage', () => {
    it('should return a canvas with the resized image on it', () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      const image = document.createElement('canvas')
      image.width = 1000
      image.height = 800

      const result = plugin.resizeImage(image, 200, 160)
      expect(result).not.toBe(image)
      expect(result).toMatchInlineSnapshot(`
        <canvas
          height="160"
          width="200"
        />
      `)
    })

    it('should upsize if original image is smaller than target size', () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      const image = document.createElement('canvas')
      image.width = 100
      image.height = 80

      const result = plugin.resizeImage(image, 200, 160)
      expect(result).not.toBe(image)
      expect(result).toMatchInlineSnapshot(`
        <canvas
          height="160"
          width="200"
        />
      `)
    })
  })

  describe('onRestored', () => {
    it('should enqueue restored files', () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      const fileId = core.addFile({
        type: 'image/jpeg',
        data: new Blob(),
      })

      vi.spyOn(plugin, 'addToQueue')

      core.emit('restored', {})
      expect(plugin.addToQueue).not.toHaveBeenCalled()

      core.setFileState(fileId, { isRestored: true })
      core.emit('restored', {})
      expect(plugin.addToQueue).toHaveBeenCalledOnce()
    })

    it('should not regenerate thumbnail for remote files', () => {
      using core = new Uppy()
      core.use(ThumbnailGeneratorPlugin)
      const plugin = core.getPlugin(
        'ThumbnailGenerator',
      ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>

      const fileId = core.addFile({
        type: 'image/jpeg',
        data: new Blob(),
        isRemote: true,
      })

      vi.spyOn(plugin, 'addToQueue')

      core.emit('restored', {})
      expect(plugin.addToQueue).not.toHaveBeenCalled()

      core.setFileState(fileId, { isRestored: true })
      core.emit('restored', {})
      expect(plugin.addToQueue).not.toHaveBeenCalled()
    })
  })
})
