import type { LocalUppyFile, Meta } from '@uppy/core/utils'

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

  describe('createThumbnail', () => {
    // A 400×300 JPEG with red, green / blue, yellow quadrants and an EXIF
    // Orientation tag.
    async function jpegWithOrientation(orientation: number): Promise<File> {
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext('2d')!
      for (const [color, x, y] of [
        ['#f00', 0, 0],
        ['#0f0', 200, 0],
        ['#00f', 0, 150],
        ['#ff0', 200, 150],
      ] as const) {
        ctx.fillStyle = color
        ctx.fillRect(x, y, 200, 150)
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 1),
      )
      const jpeg = new Uint8Array(await blob!.arrayBuffer())
      // APP1 segment: marker and length, 'Exif\0\0', a little-endian TIFF
      // header, then an IFD0 with one entry, Orientation (0x0112) as a SHORT.
      const hex = `ffe10022 457869660000 49492a0008000000 0100 1201030001000000 0${orientation}000000 00000000`
      const app1 = Uint8Array.from(hex.replaceAll(' ', '').match(/../g)!, (b) =>
        Number.parseInt(b, 16),
      )
      return new File([jpeg.subarray(0, 2), app1, jpeg.subarray(2)], 'a.jpg', {
        type: 'image/jpeg',
      })
    }

    it.each([
      // [orientation, thumbnail size, quadrant colours as RGB bits]
      [1, [200, 150], ['100', '010', '001', '110']],
      // 3 = rotate 180°: yellow, blue / green, red
      [3, [200, 150], ['110', '001', '010', '100']],
      // 5 = mirror across the main diagonal: red, blue / green, yellow
      [5, [200, 267], ['100', '001', '010', '110']],
      // 6 = rotate 90° clockwise to display: blue, red / yellow, green
      [6, [200, 267], ['001', '100', '110', '010']],
      // 7 = mirror across the other diagonal: yellow, green / blue, red
      [7, [200, 267], ['110', '010', '001', '100']],
      // 8 = rotate 90° counter-clockwise: green, yellow / red, blue
      [8, [200, 267], ['010', '110', '100', '001']],
    ])(
      'should draw EXIF orientation %i the way the browser displays it',
      async (orientation, size, colors) => {
        using core = new Uppy()
        core.use(ThumbnailGeneratorPlugin)
        const plugin = core.getPlugin(
          'ThumbnailGenerator',
        ) as ThumbnailGeneratorPlugin<Meta, Record<string, never>>
        const fileId = core.addFile({
          name: 'a.jpg',
          type: 'image/jpeg',
          data: await jpegWithOrientation(orientation),
        })

        const thumbnail = new Image()
        thumbnail.src = await plugin.createThumbnail(
          core.getFile(fileId) as LocalUppyFile<Meta, Record<string, never>>,
          200,
          null,
        )
        await thumbnail.decode()
        const [w, h] = [thumbnail.naturalWidth, thumbnail.naturalHeight]
        expect([w, h]).toEqual(size)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(thumbnail, 0, 0)
        const bits = (x: number, y: number) =>
          Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3))
            .map((c) => (c > 127 ? 1 : 0))
            .join('')
        expect([
          bits(w / 4, h / 4),
          bits((3 * w) / 4, h / 4),
          bits(w / 4, (3 * h) / 4),
          bits((3 * w) / 4, (3 * h) / 4),
        ]).toEqual(colors)
      },
    )
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
