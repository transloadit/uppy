const ThumbnailGeneratorPlugin = require('./index')
const { Plugin } = require('@uppy/core')
const emitter = require('namespace-emitter')

const delay = duration => new Promise(resolve => setTimeout(resolve, duration))

function MockCore () {
  const core = emitter()
  const files = {}
  core.mockFile = (id, f) => { files[id] = f }
  core.getFile = (id) => files[id]
  core.log = () => null
  return core
}

describe('uploader/ThumbnailGeneratorPlugin', () => {
  it('should initialise successfully', () => {
    const plugin = new ThumbnailGeneratorPlugin(new MockCore(), {})
    expect(plugin instanceof Plugin).toEqual(true)
  })

  it('should accept the thumbnailWidth and thumbnailHeight option and override the default', () => {
    const plugin1 = new ThumbnailGeneratorPlugin(new MockCore()) // eslint-disable-line no-new
    expect(plugin1.opts.thumbnailWidth).toEqual(null)
    expect(plugin1.opts.thumbnailHeight).toEqual(null)

    const plugin2 = new ThumbnailGeneratorPlugin(new MockCore(), { thumbnailWidth: 100 }) // eslint-disable-line no-new
    expect(plugin2.opts.thumbnailWidth).toEqual(100)

    const plugin3 = new ThumbnailGeneratorPlugin(new MockCore(), { thumbnailHeight: 100 }) // eslint-disable-line no-new
    expect(plugin3.opts.thumbnailHeight).toEqual(100)
  })

  describe('install', () => {
    it('should subscribe to uppy file-added event', () => {
      const core = Object.assign(new MockCore(), {
        on: jest.fn()
      })

      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.addToQueue = jest.fn()
      plugin.install()

      expect(core.on).toHaveBeenCalledTimes(3)
      expect(core.on).toHaveBeenCalledWith('file-added', plugin.onFileAdded)
    })
  })

  describe('uninstall', () => {
    it('should unsubscribe from uppy file-added event', () => {
      const core = Object.assign(new MockCore(), {
        on: jest.fn(),
        off: jest.fn()
      })

      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.addToQueue = jest.fn()
      plugin.install()

      expect(core.on).toHaveBeenCalledTimes(3)

      plugin.uninstall()

      expect(core.off).toHaveBeenCalledTimes(3)
      expect(core.off).toHaveBeenCalledWith('file-added', plugin.onFileAdded)
    })
  })

  describe('queue', () => {
    it('should add a new file to the queue and start processing the queue when queueProcessing is false', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.processQueue = jest.fn()

      const file = { foo: 'bar' }
      plugin.queueProcessing = false
      plugin.addToQueue(file)
      expect(plugin.queue).toEqual([{ foo: 'bar' }])
      expect(plugin.processQueue).toHaveBeenCalledTimes(1)

      const file2 = { foo: 'bar2' }
      plugin.queueProcessing = true
      plugin.addToQueue(file2)
      expect(plugin.queue).toEqual([{ foo: 'bar' }, { foo: 'bar2' }])
      expect(plugin.processQueue).toHaveBeenCalledTimes(1)
    })

    it('should process items in the queue one by one', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)

      plugin.requestThumbnail = jest.fn(() => delay(100))

      const file1 = { foo: 'bar' }
      const file2 = { foo: 'bar2' }
      const file3 = { foo: 'bar3' }
      plugin.addToQueue(file1)
      plugin.addToQueue(file2)
      plugin.addToQueue(file3)

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

      URL.revokeObjectURL = jest.fn(() => null)

      try {
        plugin.createThumbnail = jest.fn(async () => {
          await delay(50)
          return 'blob:http://uppy.io/fake-thumbnail'
        })
        plugin.setPreviewURL = jest.fn((id, preview) => {
          if (id === 1) file1.preview = preview
          if (id === 2) file2.preview = preview
        })

        const file1 = { id: 1, name: 'bar.jpg', type: 'image/jpeg' }
        const file2 = { id: 2, name: 'bar2.jpg', type: 'image/jpeg' }
        core.emit('file-added', file1)
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
    plugin.createThumbnail = jest.fn((file) => delay(100).then(() => `blob:${file.id}.png`))
    plugin.setPreviewURL = jest.fn()

    function add (file) {
      core.mockFile(file.id, file)
      plugin.addToQueue(file)
    }

    it('should emit thumbnail:generated when a thumbnail was generated', () => new Promise((resolve, reject) => {
      const expected = ['bar', 'bar2', 'bar3']
      core.on('thumbnail:generated', (file, preview) => {
        try {
          expect(file.id).toBe(expected.shift())
          expect(preview).toBe(`blob:${file.id}.png`)
        } catch (err) {
          return reject(err)
        }
        if (expected.length === 0) resolve()
      })
      add({ id: 'bar', type: 'image/png' })
      add({ id: 'bar2', type: 'image/png' })
      add({ id: 'bar3', type: 'image/png' })
    }))

    it('should emit thumbnail:all-generated when all thumbnails were generated', () => {
      return new Promise((resolve) => {
        core.on('thumbnail:all-generated', resolve)
        add({ id: 'bar4', type: 'image/png' })
        add({ id: 'bar5', type: 'image/png' })
      }).then(() => {
        expect(plugin.queue).toHaveLength(0)
      })
    })
  })

  describe('requestThumbnail', () => {
    it('should call createThumbnail if it is a supported filetype', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)

      plugin.createThumbnail = jest
        .fn()
        .mockReturnValue(Promise.resolve('preview'))
      plugin.setPreviewURL = jest.fn()

      const file = { id: 'file1', type: 'image/png', isRemote: false }
      return plugin.requestThumbnail(file).then(() => {
        expect(plugin.createThumbnail).toHaveBeenCalledTimes(1)
        expect(plugin.createThumbnail).toHaveBeenCalledWith(
          file,
          plugin.opts.thumbnailWidth,
          plugin.opts.thumbnailHeight
        )
      })
    })

    it('should not call createThumbnail if it is not a supported filetype', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)

      plugin.createThumbnail = jest
        .fn()
        .mockReturnValue(Promise.resolve('preview'))
      plugin.setPreviewURL = jest.fn()

      const file = { id: 'file1', type: 'text/html', isRemote: false }
      return plugin.requestThumbnail(file).then(() => {
        expect(plugin.createThumbnail).toHaveBeenCalledTimes(0)
      })
    })

    it('should not call createThumbnail if the file is remote', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)

      plugin.createThumbnail = jest
        .fn()
        .mockReturnValue(Promise.resolve('preview'))
      plugin.setPreviewURL = jest.fn()

      const file = { id: 'file1', type: 'image/png', isRemote: true }
      return plugin.requestThumbnail(file).then(() => {
        expect(plugin.createThumbnail).toHaveBeenCalledTimes(0)
      })
    })

    it('should call setPreviewURL with the thumbnail image', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)

      plugin.createThumbnail = jest
        .fn()
        .mockReturnValue(Promise.resolve('preview'))
      plugin.setPreviewURL = jest.fn()

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
              preview: 'foo'
            },
            file2: {
              preview: 'boo'
            }
          }
        },
        setFileState: jest.fn()
      }
      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.setPreviewURL('file1', 'moo')
      expect(core.setFileState).toHaveBeenCalledTimes(1)
      expect(core.setFileState).toHaveBeenCalledWith('file1', {
        preview: 'moo'
      })
    })
  })

  describe('getProportionalDimensions', () => {
    function resize (thumbnailPlugin, image, width, height) {
      return thumbnailPlugin.getProportionalDimensions(image, width, height)
    }

    it('should calculate the thumbnail dimensions based on the width whilst keeping aspect ratio', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      expect(resize(plugin, { width: 200, height: 100 }, 50)).toEqual({ width: 50, height: 25 })
      expect(resize(plugin, { width: 66, height: 66 }, 33)).toEqual({ width: 33, height: 33 })
      expect(resize(plugin, { width: 201.2, height: 198.2 }, 47)).toEqual({ width: 47, height: 46 })
    })

    it('should calculate the thumbnail dimensions based on the height whilst keeping aspect ratio', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      expect(resize(plugin, { width: 200, height: 100 }, null, 50)).toEqual({ width: 100, height: 50 })
      expect(resize(plugin, { width: 66, height: 66 }, null, 33)).toEqual({ width: 33, height: 33 })
      expect(resize(plugin, { width: 201.2, height: 198.2 }, null, 47)).toEqual({ width: 48, height: 47 })
    })

    it('should calculate the thumbnail dimensions based on the default width if no custom width is given', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.defaultThumbnailDimension = 50
      expect(resize(plugin, { width: 200, height: 100 })).toEqual({ width: 50, height: 25 })
    })

    it('should calculate the thumbnail dimensions based on the width if both width and height are given', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      expect(resize(plugin, { width: 200, height: 100 }, 50, 42)).toEqual({ width: 50, height: 25 })
    })
  })

  describe('canvasToBlob', () => {
    it('should use canvas.toBlob if available', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      const canvas = {
        toBlob: jest.fn()
      }
      plugin.canvasToBlob(canvas, 'type', 90)
      expect(canvas.toBlob).toHaveBeenCalledTimes(1)
      expect(canvas.toBlob.mock.calls[0][1]).toEqual('type')
      expect(canvas.toBlob.mock.calls[0][2]).toEqual(90)
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

    xit('should scale down the image by the specified number of steps', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      const image = {
        width: 1000,
        height: 800
      }
      const context = {
        drawImage: jest.fn()
      }
      const canvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue(context)
      }
      document.createElement = jest.fn().mockReturnValue(canvas)
      const result = plugin.downScaleInSteps(image, 3)
      const newImage = {
        getContext: canvas.getContext,
        height: 100,
        width: 125
      }
      expect(result).toEqual({
        image: newImage,
        sourceWidth: 125,
        sourceHeight: 100
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
          200
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
          100
        ]
      ])
    })
  })

  describe('resizeImage', () => {
    it('should return a canvas with the resized image on it', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      const image = {
        width: 1000,
        height: 800
      }
      const context = {
        drawImage: jest.fn()
      }
      const canvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue(context)
      }
      document.createElement = jest.fn().mockReturnValue(canvas)

      const result = plugin.resizeImage(image, 200, 160)
      expect(result).toEqual({
        width: 200,
        height: 160,
        getContext: canvas.getContext
      })
    })

    it('should upsize if original image is smaller than target size', () => {
      const core = new MockCore()
      const plugin = new ThumbnailGeneratorPlugin(core)
      const image = {
        width: 100,
        height: 80
      }
      const context = {
        drawImage: jest.fn()
      }
      const canvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue(context)
      }
      document.createElement = jest.fn().mockReturnValue(canvas)

      const result = plugin.resizeImage(image, 200, 160)
      expect(result).toEqual({
        width: 200,
        height: 160,
        getContext: canvas.getContext
      })
    })
  })

  describe('onRestored', () => {
    it('should enqueue restored files', () => {
      const files = {
        a: { preview: 'blob:abc', isRestored: true },
        b: { preview: 'blob:def' },
        c: { preview: 'blob:xyz', isRestored: true }
      }
      const core = Object.assign(new MockCore(), {
        getState () {
          return { files }
        },
        getFile (id) {
          return files[id]
        }
      })

      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.addToQueue = jest.fn()
      plugin.install()

      core.emit('restored')

      expect(plugin.addToQueue).toHaveBeenCalledTimes(2)
      expect(plugin.addToQueue).toHaveBeenCalledWith(files.a)
      expect(plugin.addToQueue).toHaveBeenCalledWith(files.c)
    })

    it('should not regenerate thumbnail for remote files', () => {
      const files = {
        a: { preview: 'http://abc', isRestored: true }
      }
      const core = Object.assign(new MockCore(), {
        getState () {
          return { files }
        },
        getFile (id) {
          return files[id]
        }
      })

      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.addToQueue = jest.fn()
      plugin.install()

      core.emit('restored')

      expect(plugin.addToQueue).not.toHaveBeenCalled()
    })
  })
})
