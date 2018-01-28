import ImageCompressorPlugin from './index'
import Plugin from '../../core/Plugin'

const delay = duration => new Promise(resolve => setTimeout(resolve, duration))

describe('modifier/ImageCompressorPlugin', () => {
  it('should initialise successfully', () => {
    const plugin = new ImageCompressorPlugin(null, {})
    expect(plugin instanceof Plugin).toEqual(true)
  })

  it('should accept width, height and quality options and override the default', () => {
    const plugin1 = new ImageCompressorPlugin(null) // eslint-disable-line no-new
    expect(plugin1.opts.width).toEqual(undefined)
    expect(plugin1.opts.height).toEqual(undefined)
    expect(plugin1.opts.quality).toEqual(0.8)

    const plugin2 = new ImageCompressorPlugin(null, { width: 100, height: 100, quality: 0.6 }) // eslint-disable-line no-new
    expect(plugin2.opts.width).toEqual(100)
    expect(plugin2.opts.height).toEqual(100)
    expect(plugin2.opts.quality).toEqual(0.4)
  })

  describe('install', () => {
    it('should subscribe to uppy file-added event', () => {
      const core = {
        on: jest.fn()
      }

      const plugin = new ImageCompressorPlugin(core)
      plugin.addToQueue = jest.fn()
      plugin.install()

      expect(core.on).toHaveBeenCalledTimes(1)
      expect(core.on).toHaveBeenCalledWith('file-added', plugin.addToQueue)
    })
  })

  describe('uninstall', () => {
    it('should unsubscribe from uppy file-added event', () => {
      const core = {
        on: jest.fn(),
        off: jest.fn()
      }

      const plugin = new ImageCompressorPlugin(core)
      plugin.addToQueue = jest.fn()
      plugin.install()

      expect(core.on).toHaveBeenCalledTimes(1)

      plugin.uninstall()

      expect(core.off).toHaveBeenCalledTimes(1)
      expect(core.off).toHaveBeenCalledWith('file-added', plugin.addToQueue)
    })
  })

  describe('queue', () => {
    it('should add a new file to the queue and start processing the queue when queueProcessing is false', () => {
      const core = {}
      const plugin = new ImageCompressorPlugin(core)
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
      const plugin = new ImageCompressorPlugin(core)

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

  describe('requestCompressFile', () => {
    it('should call compressFile if it is a supported filetype', () => {
      const core = {}
      const plugin = new ImageCompressorPlugin(core)

      plugin.compressFile = jest
        .fn()
        .mockReturnValue(Promise.resolve('compressed'))
      plugin.setCompressedFile = jest.fn()

      const file = { id: 'file1', type: 'image/png', isRemote: false }
      return plugin.requestCompressFile(file).then(() => {
        expect(plugin.compressFile).toHaveBeenCalledTimes(1)
        expect(plugin.compressFile).toHaveBeenCalledWith(
          file,
          plugin.opts.width,
          plugin.opts.height,
          plugin.opts.quality
        )
      })
    })

    it('should not call compressFile if it is not a supported filetype', () => {
      const core = {}
      const plugin = new ImageCompressorPlugin(core)

      plugin.compressFile = jest
        .fn()
        .mockReturnValue(Promise.resolve('compressed'))
      plugin.setCompressedFile = jest.fn()

      const file = { id: 'file1', type: 'text/html', isRemote: false }
      return plugin.requestCompressFile(file).then(() => {
        expect(plugin.compressFile).toHaveBeenCalledTimes(0)
      })
    })

    it('should not call compressFile if the file is remote', () => {
      const core = {}
      const plugin = new ImageCompressorPlugin(core)

      plugin.compressFile = jest
        .fn()
        .mockReturnValue(Promise.resolve('compressed'))
      plugin.setCompressedFile = jest.fn()

      const file = { id: 'file1', type: 'image/png', isRemote: true }
      return plugin.requestCompressFile(file).then(() => {
        expect(plugin.compressFile).toHaveBeenCalledTimes(0)
      })
    })

    it('should call setCompressedFile with the thumbnail image', () => {
      const core = {}
      const plugin = new ImageCompressorPlugin(core)

      plugin.compressFile = jest
        .fn()
        .mockReturnValue(Promise.resolve('compressed'))
      plugin.setCompressedFile = jest.fn()

      const file = { id: 'file1', type: 'image/png', isRemote: false }
      return plugin.requestCompressFile(file).then(() => {
        expect(plugin.setCompressedFile).toHaveBeenCalledTimes(1)
        expect(plugin.setCompressedFile).toHaveBeenCalledWith('file1', 'compressed')
      })
    })
  })

  describe('setCompressedFile', () => {
    it('should update the file data for the specified image', () => {
      const core = {
        state: {
          files: {
            file1: {
              data: 'foo'
            },
            file2: {
              data: 'boo'
            }
          }
        },
        setState: jest.fn()
      }
      const plugin = new ImageCompressorPlugin(core)
      plugin.setCompressedFile('file1', 'moo')
      expect(core.setState).toHaveBeenCalledTimes(1)
      expect(core.setState).toHaveBeenCalledWith({
        files: { file1: { data: 'moo' }, file2: { data: 'boo' } }
      })
    })
  })

  describe('canvasToBlob', () => {
    it('should use canvas.toBlob if available', () => {
      const core = {}
      const plugin = new ImageCompressorPlugin(core)
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

    it('should scale down the image by the specified number of steps', () => {
      const core = {}
      const plugin = new ImageCompressorPlugin(core)
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
      const plugin = new ImageCompressorPlugin(core)
      const image = {
        width: 1000,
        height: 800
      }
      plugin.downScaleInSteps = jest.fn().mockReturnValue({
        image: {
          height: 160,
          width: 200
        },
        sourceWidth: 200,
        sourceHeight: 160
      })
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
})
