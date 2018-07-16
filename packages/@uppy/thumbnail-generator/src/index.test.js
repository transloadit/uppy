const ThumbnailGeneratorPlugin = require('./index')
const { Plugin } = require('@uppy/core')
const emitter = require('namespace-emitter')

const delay = duration => new Promise(resolve => setTimeout(resolve, duration))

describe('uploader/ThumbnailGeneratorPlugin', () => {
  it('should initialise successfully', () => {
    const plugin = new ThumbnailGeneratorPlugin(null, {})
    expect(plugin instanceof Plugin).toEqual(true)
  })

  it('should accept the thumbnailWidth option and override the default', () => {
    const plugin1 = new ThumbnailGeneratorPlugin(null) // eslint-disable-line no-new
    expect(plugin1.opts.thumbnailWidth).toEqual(200)

    const plugin2 = new ThumbnailGeneratorPlugin(null, { thumbnailWidth: 100 }) // eslint-disable-line no-new
    expect(plugin2.opts.thumbnailWidth).toEqual(100)
  })

  describe('install', () => {
    it('should subscribe to uppy file-added event', () => {
      const core = {
        on: jest.fn()
      }

      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.addToQueue = jest.fn()
      plugin.install()

      expect(core.on).toHaveBeenCalledTimes(2)
      expect(core.on).toHaveBeenCalledWith('file-added', plugin.addToQueue)
    })
  })

  describe('uninstall', () => {
    it('should unsubscribe from uppy file-added event', () => {
      const core = {
        on: jest.fn(),
        off: jest.fn()
      }

      const plugin = new ThumbnailGeneratorPlugin(core)
      plugin.addToQueue = jest.fn()
      plugin.install()

      expect(core.on).toHaveBeenCalledTimes(2)

      plugin.uninstall()

      expect(core.off).toHaveBeenCalledTimes(2)
      expect(core.off).toHaveBeenCalledWith('file-added', plugin.addToQueue)
    })
  })

  describe('queue', () => {
    it('should add a new file to the queue and start processing the queue when queueProcessing is false', () => {
      const core = {}
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
      const core = {}
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
  })

  describe('requestThumbnail', () => {
    it('should call createThumbnail if it is a supported filetype', () => {
      const core = {}
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
          plugin.opts.thumbnailWidth
        )
      })
    })

    it('should not call createThumbnail if it is not a supported filetype', () => {
      const core = {}
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
      const core = {}
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
      const core = {}
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

  describe('getProportionalHeight', () => {
    it('should calculate the resized height based on the specified width of the image whilst keeping aspect ratio', () => {
      const core = {}
      const plugin = new ThumbnailGeneratorPlugin(core)
      expect(
        plugin.getProportionalHeight({ width: 200, height: 100 }, 50)
      ).toEqual(25)
      expect(
        plugin.getProportionalHeight({ width: 66, height: 66 }, 33)
      ).toEqual(33)
      expect(
        plugin.getProportionalHeight({ width: 201.2, height: 198.2 }, 47)
      ).toEqual(46)
    })
  })

  describe('canvasToBlob', () => {
    it('should use canvas.toBlob if available', () => {
      const core = {}
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
      const core = {}
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
      const core = {}
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
      const core = {}
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
      const core = Object.assign(emitter(), {
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
      const core = Object.assign(emitter(), {
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
