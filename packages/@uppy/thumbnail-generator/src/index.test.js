import { UIPlugin } from '@uppy/core'
import emitter from 'namespace-emitter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ThumbnailGeneratorPlugin from './index.ts'

const delay = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration))

function MockCore() {
  const core = emitter()
  const files = {}
  core.state = {
    files,
    plugins: {},
  }
  core.mockFile = (id, f) => {
    files[id] = f
  }
  core.getFile = (id) => files[id]
  core.log = (message, level = 'log') => {
    if (level === 'warn' || level === 'error') {
      console[level](message)
    }
  }
  core.getState = () => core.state
  core.setState = () => null
  return core
}

describe('uploader/ThumbnailGeneratorPlugin', () => {
  it('should initialise successfully', () => {
    const plugin = new ThumbnailGeneratorPlugin(new MockCore(), {})
    expect(plugin instanceof UIPlugin).toEqual(true)
  })

  it('should accept the thumbnailWidth and thumbnailHeight option and override the default', () => {
    const plugin1 = new ThumbnailGeneratorPlugin(new MockCore())
    expect(plugin1.opts.thumbnailWidth).toEqual(null)
    expect(plugin1.opts.thumbnailHeight).toEqual(null)

    const plugin2 = new ThumbnailGeneratorPlugin(new MockCore(), {
      thumbnailWidth: 100,
    })
    expect(plugin2.opts.thumbnailWidth).toEqual(100)

    const plugin3 = new ThumbnailGeneratorPlugin(new MockCore(), {
      thumbnailHeight: 100,
    })
    expect(plugin3.opts.thumbnailHeight).toEqual(100)
  })

  describe('install', () => {
    it('should subscribe to uppy file-added event', () => {
      const core = Object.assign(new MockCore(), {
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
      const core = Object.assign(new MockCore(), {
        on: vi.fn(),
        off: vi.fn(),
      })

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
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
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

    it('should process items in the queue one by one', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.requestThumbnail = vi.fn(() => delay(100))
      plugin.install()

      const file1 = { id: 'bar', type: 'image/jpeg', data: new Blob() }
      const file2 = { id: 'bar2', type: 'image/jpeg', data: new Blob() }
      const file3 = { id: 'bar3', type: 'image/jpeg', data: new Blob() }
      core.mockFile(file1.id, file1)
      core.emit('file-added', file1)
      core.mockFile(file2.id, file2)
      core.emit('file-added', file2)
      core.mockFile(file3.id, file3)
      core.emit('file-added', file3)

      expect(plugin.requestThumbnail).toHaveBeenCalledTimes(1)
      expect(plugin.requestThumbnail).toHaveBeenCalledWith(file1)

      return delay(110)
        .then(() => {
          expect(plugin.requestThumbnail).toHaveBeenCalledTimes(2)
          expect(plugin.requestThumbnail).toHaveBeenCalledWith(file2)
          return delay(110)
        })
        .then(() => {
          expect(plugin.requestThumbnail).toHaveBeenCalledTimes(3)
          expect(plugin.requestThumbnail).toHaveBeenCalledWith(file3)
          return delay(110)
        })
        .then(() => {
          expect(plugin.queue).toEqual([])
          expect(plugin.queueProcessing).toEqual(false)
        })
    })

    it('should revoke object URLs when files are removed', async () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.install()

      URL.revokeObjectURL = vi.fn(() => null)

      try {
        const file1 = {
          id: 1,
          name: 'bar.jpg',
          type: 'image/jpeg',
          data: new Blob(),
        }
        const file2 = {
          id: 2,
          name: 'bar2.jpg',
          type: 'image/jpeg',
          data: new Blob(),
        }

        plugin.createThumbnail = vi.fn(async () => {
          await delay(50)
          return 'blob:http://uppy.io/fake-thumbnail'
        })
        plugin.setPreviewURL = vi.fn((id, preview) => {
          if (id === 1) file1.preview = preview
          if (id === 2) file2.preview = preview
        })

        core.mockFile(file1.id, file1)
        core.emit('file-added', file1)
        core.mockFile(file2.id, file2)
        core.emit('file-added', file2)
        expect(plugin.queue).toHaveLength(1)
        // should drop it from the queue
        core.emit('file-removed', file2)
        expect(plugin.queue).toHaveLength(0)

        expect(plugin.createThumbnail).toHaveBeenCalledTimes(1)
        expect(URL.revokeObjectURL).not.toHaveBeenCalled()

        await delay(110)

        core.emit('file-removed', file1)
        expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
      } finally {
        delete URL.revokeObjectURL
      }
    })
  })

  describe('events', () => {
    const core = new MockCore()
    const plugin = new ThumbnailGeneratorPlugin(core)
    plugin.createThumbnail = vi.fn((file) =>
      delay(100).then(() => `blob:${file.id}.png`),
    )
    plugin.setPreviewURL = vi.fn()
    plugin.install()

    function add(file) {
      core.mockFile(file.id, file)
      core.emit('file-added', file)
    }

    it('should emit thumbnail:generated when a thumbnail was generated', () =>
      new Promise((resolve, reject) => {
        const expected = ['bar', 'bar2', 'bar3']
        core.on('thumbnail:generated', (file, preview) => {
          try {
            expect(file.id).toBe(expected.shift())
            expect(preview).toBe(`blob:${file.id}.png`)
          } catch (err) {
            reject(err)
            return
          }
          if (expected.length === 0) resolve()
        })
        add({ id: 'bar', type: 'image/png', data: new Blob() })
        add({ id: 'bar2', type: 'image/png', data: new Blob() })
        add({ id: 'bar3', type: 'image/png', data: new Blob() })
      }))

    it('should emit thumbnail:all-generated when all thumbnails were generated', () => {
      return new Promise((resolve) => {
        core.on('thumbnail:all-generated', resolve)
        add({ id: 'bar4', type: 'image/png', data: new Blob() })
        add({ id: 'bar5', type: 'image/png', data: new Blob() })
      }).then(() => {
        expect(plugin.queue).toHaveLength(0)
      })
    })
  })

  describe('requestThumbnail', () => {
    it('should call createThumbnail if it is a supported filetype', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)

      plugin.createThumbnail = vi
        .fn()
        .mockReturnValue(Promise.resolve('preview'))
      plugin.setPreviewURL = vi.fn()

      const file = { id: 'file1', type: 'image/png', isRemote: false }
      return plugin.requestThumbnail(file).then(() => {
        expect(plugin.createThumbnail).toHaveBeenCalledTimes(1)
        expect(plugin.createThumbnail).toHaveBeenCalledWith(
          file,
          plugin.opts.thumbnailWidth,
          plugin.opts.thumbnailHeight,
        )
      })
    })

    it('should not call createThumbnail if it is not a supported filetype', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)

      plugin.createThumbnail = vi
        .fn()
        .mockReturnValue(Promise.resolve('preview'))
      plugin.setPreviewURL = vi.fn()

      const file = { id: 'file1', type: 'text/html', isRemote: false }
      return plugin.requestThumbnail(file).then(() => {
        expect(plugin.createThumbnail).toHaveBeenCalledTimes(0)
      })
    })

    it('should not call createThumbnail if the file is remote', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)

      plugin.createThumbnail = vi
        .fn()
        .mockReturnValue(Promise.resolve('preview'))
      plugin.setPreviewURL = vi.fn()

      const file = { id: 'file1', type: 'image/png', isRemote: true }
      return plugin.requestThumbnail(file).then(() => {
        expect(plugin.createThumbnail).toHaveBeenCalledTimes(0)
      })
    })

    it('should call setPreviewURL with the thumbnail image', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)

      plugin.createThumbnail = vi
        .fn()
        .mockReturnValue(Promise.resolve('preview'))
      plugin.setPreviewURL = vi.fn()

      const file = { id: 'file1', type: 'image/png', isRemote: false }
      return plugin.requestThumbnail(file).then(() => {
        expect(plugin.setPreviewURL).toHaveBeenCalledTimes(1)
        expect(plugin.setPreviewURL).toHaveBeenCalledWith('file1', 'preview')
      })
    })
  })

  describe('setPreviewURL', () => {
    it('should update the preview url for the specified image', () => {
      const core = {
        state: {
          files: {
            file1: {
              preview: 'foo',
            },
            file2: {
              preview: 'boo',
            },
          },
        },
        setFileState: vi.fn(),
        plugins: {},
      }
      core.state = {
        plugins: {},
      }
      core.setState = () => null
      core.getState = () => core.state

      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.setPreviewURL('file1', 'moo')
      expect(core.setFileState).toHaveBeenCalledTimes(1)
      expect(core.setFileState).toHaveBeenCalledWith('file1', {
        preview: 'moo',
      })
    })
  })

  describe('getProportionalDimensions', () => {
    function resize(thumbnailPlugin, image, width, height) {
      return thumbnailPlugin.getProportionalDimensions(image, width, height)
    }

    it('should calculate the thumbnail dimensions based on the width whilst keeping aspect ratio', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      expect(resize(plugin, { width: 200, height: 100 }, 50)).toEqual({
        width: 50,
        height: 25,
      })
      expect(resize(plugin, { width: 66, height: 66 }, 33)).toEqual({
        width: 33,
        height: 33,
      })
      expect(resize(plugin, { width: 201.2, height: 198.2 }, 47)).toEqual({
        width: 47,
        height: 46,
      })
    })

    it('should calculate the thumbnail dimensions based on the height whilst keeping aspect ratio', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      expect(resize(plugin, { width: 200, height: 100 }, null, 50)).toEqual({
        width: 100,
        height: 50,
      })
      expect(resize(plugin, { width: 66, height: 66 }, null, 33)).toEqual({
        width: 33,
        height: 33,
      })
      expect(resize(plugin, { width: 201.2, height: 198.2 }, null, 47)).toEqual(
        { width: 48, height: 47 },
      )
    })

    it('should calculate the thumbnail dimensions based on the default width if no custom width is given', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.defaultThumbnailDimension = 50
      expect(resize(plugin, { width: 200, height: 100 })).toEqual({
        width: 50,
        height: 25,
      })
    })

    it('should calculate the thumbnail dimensions based on the width if both width and height are given', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      expect(resize(plugin, { width: 200, height: 100 }, 50, 42)).toEqual({
        width: 50,
        height: 25,
      })
    })
  })

  describe('downScaleInSteps', () => {
    let originalDocumentCreateElement
    let originalURLCreateObjectURL

    beforeEach(() => {
      originalDocumentCreateElement = document.createElement
      originalURLCreateObjectURL = URL.createObjectURL
    })

    afterEach(() => {
      document.createElement = originalDocumentCreateElement
      URL.createObjectURL = originalURLCreateObjectURL
    })

    it.skip('should scale down the image by the specified number of steps', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      const image = {
        width: 1000,
        height: 800,
      }
      const context = {
        drawImage: vi.fn(),
      }
      const canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(context),
      }
      document.createElement = vi.fn().mockReturnValue(canvas)
      const result = plugin.downScaleInSteps(image, 3)
      const newImage = {
        getContext: canvas.getContext,
        height: 100,
        width: 125,
      }
      expect(result).toEqual({
        image: newImage,
        sourceWidth: 125,
        sourceHeight: 100,
      })
      expect(context.drawImage).toHaveBeenCalledTimes(3)
      expect(context.drawImage.mock.calls).toEqual([
        [{ width: 1000, height: 800 }, 0, 0, 1000, 800, 0, 0, 500, 400],
        [
          { width: 125, height: 100, getContext: canvas.getContext },
          0,
          0,
          500,
          400,
          0,
          0,
          250,
          200,
        ],
        [
          { width: 125, height: 100, getContext: canvas.getContext },
          0,
          0,
          250,
          200,
          0,
          0,
          125,
          100,
        ],
      ])
    })
  })

  describe('resizeImage', () => {
    it('should return a canvas with the resized image on it', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      const image = {
        width: 1000,
        height: 800,
      }
      const context = {
        drawImage: vi.fn(),
      }
      const canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(context),
      }
      document.createElement = vi.fn().mockReturnValue(canvas)

      const result = plugin.resizeImage(image, 200, 160)
      expect(result).toEqual({
        width: 200,
        height: 160,
        getContext: canvas.getContext,
      })
    })

    it('should upsize if original image is smaller than target size', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      const image = {
        width: 100,
        height: 80,
      }
      const context = {
        drawImage: vi.fn(),
      }
      const canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(context),
      }
      document.createElement = vi.fn().mockReturnValue(canvas)

      const result = plugin.resizeImage(image, 200, 160)
      expect(result).toEqual({
        width: 200,
        height: 160,
        getContext: canvas.getContext,
      })
    })
  })

  describe('onRestored', () => {
    it('should enqueue restored files', () => {
      const files = {
        a: { id: 'a', type: 'image/jpeg', isRestored: true, data: new Blob() },
        b: { id: 'b', type: 'image/jpeg', data: new Blob() },
        c: { id: 'c', type: 'image/jpeg', isRestored: true, data: new Blob() },
      }
      const core = Object.assign(new MockCore(), {
        getState() {
          return { files, plugins: {} }
        },
        getFile(id) {
          return files[id]
        },
        getFiles() {
          return Object.values(files)
        },
      })

      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.addToQueue = vi.fn()
      plugin.install()

      core.emit('restored')

      expect(plugin.addToQueue).toHaveBeenCalledTimes(2)
      expect(plugin.addToQueue).toHaveBeenCalledWith(files.a.id)
      expect(plugin.addToQueue).toHaveBeenCalledWith(files.c.id)
    })

    it('should not regenerate thumbnail for remote files', () => {
      const files = {
        a: { preview: 'http://abc', isRestored: true },
      }
      const core = Object.assign(new MockCore(), {
        getState() {
          return { files, plugins: {} }
        },
        getFile(id) {
          return files[id]
        },
        getFiles() {
          return Object.values(files)
        },
      })

      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.addToQueue = vi.fn()
      plugin.install()

      core.emit('restored')

      expect(plugin.addToQueue).not.toHaveBeenCalled()
    })
  })
})
