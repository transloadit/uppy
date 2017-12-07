import utils from './Utils'

const sampleImageDataURI =
  'data:image/jpeg;base64,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'

describe('core/utils', () => {
  describe('generateFileID', () => {
    it('should take the filename object and produce a lowercase file id made up of uppy- prefix, file name (cleaned up to be lowercase, letters and numbers only), type, size and lastModified date', () => {
      const fileObj = {
        name: 'fOo0Fi@£$.jpg',
        type: 'image/jpeg',
        data: {
          lastModified: 1498510508000,
          size: 2271173
        }
      }

      expect(utils.generateFileID(fileObj)).toEqual(
        'uppy-foo0fijpg-image/jpeg-2271173-1498510508000'
      )
    })
  })

  describe('toArray', () => {
    it('should convert a array-like object into an array', () => {
      const obj = {
        '0': 'zero',
        '1': 'one',
        '2': 'two',
        '3': 'three',
        '4': 'four',
        length: 5
      }

      expect(utils.toArray(obj)).toEqual([
        'zero',
        'one',
        'two',
        'three',
        'four'
      ])
    })
  })

  describe('runPromiseSequence', () => {
    it('should run an array of promise-returning functions in sequence', () => {
      const promiseFn1 = jest.fn().mockReturnValue(Promise.resolve)
      const promiseFn2 = jest.fn().mockReturnValue(Promise.resolve)
      const promiseFn3 = jest.fn().mockReturnValue(Promise.resolve)
      return utils
        .runPromiseSequence([promiseFn1, promiseFn2, promiseFn3])
        .then(() => {
          expect(promiseFn1.mock.calls.length).toEqual(1)
          expect(promiseFn2.mock.calls.length).toEqual(1)
          expect(promiseFn3.mock.calls.length).toEqual(1)
        })
    })
  })

  describe('isTouchDevice', () => {
    const RealTouchStart = global.window.ontouchstart
    const RealMaxTouchPoints = global.navigator.maxTouchPoints

    beforeEach(() => {
      global.window.ontouchstart = true
      global.navigator.maxTouchPoints = 1
    })

    afterEach(() => {
      global.navigator.maxTouchPoints = RealMaxTouchPoints
      global.window.ontouchstart = RealTouchStart
    })

    xit("should return true if it's a touch device", () => {
      expect(utils.isTouchDevice()).toEqual(true)
      delete global.window.ontouchstart
      global.navigator.maxTouchPoints = false
      expect(utils.isTouchDevice()).toEqual(false)
    })
  })

  describe('getFileNameAndExtension', () => {
    it('should return the filename and extension as an array', () => {
      expect(utils.getFileNameAndExtension('fsdfjodsuf23rfw.jpg')).toEqual({
        name: 'fsdfjodsuf23rfw',
        extension: 'jpg'
      })
    })

    it('should handle invalid filenames', () => {
      expect(utils.getFileNameAndExtension('fsdfjodsuf23rfw')).toEqual({
        name: 'fsdfjodsuf23rfw',
        extension: undefined
      })
    })
  })

  describe('truncateString', () => {
    it('should truncate the string by the specified amount', () => {
      expect(utils.truncateString('abcdefghijkl', 10)).toEqual('abcde...jkl')
      expect(utils.truncateString('abcdefghijkl', 9)).toEqual('abcd...jkl')
      expect(utils.truncateString('abcdefghijkl', 8)).toEqual('abcd...kl')
      expect(utils.truncateString('abcdefghijkl', 7)).toEqual('abc...kl')
      expect(utils.truncateString('abcdefghijkl', 6)).toEqual('abc...kl')
      expect(utils.truncateString('abcdefghijkl', 5)).toEqual('ab...kl')
      expect(utils.truncateString('abcdefghijkl', 4)).toEqual('ab...l')
      expect(utils.truncateString('abcdefghijkl', 3)).toEqual('a...l')
      expect(utils.truncateString('abcdefghijkl', 2)).toEqual('a...l')
      expect(utils.truncateString('abcdefghijkl', 1)).toEqual('...l')
    })
  })

  describe('secondsToTime', () => {
    expect(utils.secondsToTime(60)).toEqual({
      hours: 0,
      minutes: 1,
      seconds: 0
    })

    expect(utils.secondsToTime(123)).toEqual({
      hours: 0,
      minutes: 2,
      seconds: 3
    })

    expect(utils.secondsToTime(1060)).toEqual({
      hours: 0,
      minutes: 17,
      seconds: 40
    })

    expect(utils.secondsToTime(123453460)).toEqual({
      hours: 20,
      minutes: 37,
      seconds: 40
    })
  })

  describe('getFileTypeExtension', () => {
    it('should return the filetype based on the specified mime type', () => {
      expect(utils.getFileTypeExtension('video/ogg')).toEqual('ogv')
      expect(utils.getFileTypeExtension('audio/ogg')).toEqual('ogg')
      expect(utils.getFileTypeExtension('video/webm')).toEqual('webm')
      expect(utils.getFileTypeExtension('audio/webm')).toEqual('webm')
      expect(utils.getFileTypeExtension('video/mp4')).toEqual('mp4')
      expect(utils.getFileTypeExtension('audio/mp3')).toEqual('mp3')
      expect(utils.getFileTypeExtension('foo/bar')).toEqual(null)
    })
  })

  describe('getFileType', () => {
    beforeEach(() => {
      global.FileReader = class FileReader {
        addEventListener (e, cb) {
          if (e === 'load') {
            this.loadCb = cb
          }
          if (e === 'error') {
            this.errorCb = cb
          }
        }
        readAsArrayBuffer (chunk) {
          this.loadCb({ target: { result: new ArrayBuffer(8) } })
        }
      }
    })

    afterEach(() => {
      global.FileReader = undefined
    })

    it('should trust the filetype if the file comes from a remote source', () => {
      const file = {
        isRemote: true,
        type: 'audio/webm',
        name: 'foo.webm'
      }
      return utils.getFileType(file).then(r => {
        expect(r).toEqual('audio/webm')
      })
    })

    it('should determine the filetype from the mimetype', () => {
      const file = {
        type: 'audio/webm',
        name: 'foo.webm',
        data: 'sdfsdfhq9efbicw'
      }
      return utils.getFileType(file).then(r => {
        expect(r).toEqual('audio/webm')
      })
    })

    it('should determine the filetype from the extension', () => {
      const file = {
        name: 'foo.mp3',
        data: 'sdfsfhfh329fhwihs'
      }
      return utils.getFileType(file).then(r => {
        expect(r).toEqual('audio/mp3')
      })
    })

    it('should fail gracefully if unable to detect', () => {
      const file = {
        name: 'foobar',
        data: 'sdfsfhfh329fhwihs'
      }
      return utils.getFileType(file).then(r => {
        expect(r).toEqual(null)
      })
    })
  })

  describe('getArrayBuffer', () => {
    beforeEach(() => {
      global.FileReader = class FileReader {
        addEventListener (e, cb) {
          if (e === 'load') {
            this.loadCb = cb
          }
          if (e === 'error') {
            this.errorCb = cb
          }
        }
        readAsArrayBuffer (chunk) {
          this.loadCb({ target: { result: new ArrayBuffer(8) } })
        }
      }
    })

    afterEach(() => {
      global.FileReader = undefined
    })

    it('should return a promise that resolves with the specified chunk', () => {
      return utils.getArrayBuffer('abcde').then(buffer => {
        expect(typeof buffer).toEqual('object')
        expect(buffer.byteLength).toEqual(8)
      })
    })
  })

  describe('isPreviewSupported', () => {
    it('should return true for any filetypes that browsers can preview', () => {
      const supported = ['image/jpeg', 'image/gif', 'image/png', 'image/svg', 'image/svg+xml', 'image/bmp']
      supported.forEach(ext => {
        expect(utils.isPreviewSupported(ext)).toEqual(true)
      })
      expect(utils.isPreviewSupported('foo')).toEqual(false)
    })
  })

  describe('isObjectURL', () => {
    it('should return true if the specified url is an object url', () => {
      expect(utils.isObjectURL('blob:abc123')).toEqual(true)
      expect(utils.isObjectURL('kblob:abc123')).toEqual(false)
      expect(utils.isObjectURL('blob-abc123')).toEqual(false)
      expect(utils.isObjectURL('abc123')).toEqual(false)
    })
  })

  describe('createThumbnail', () => {
    const RealCreateObjectUrl = global.URL.createObjectURL

    beforeEach(() => {
      global.URL.createObjectURL = jest.fn().mockReturnValue('newUrl')
    })

    afterEach(() => {
      global.URL.createObjectURL = RealCreateObjectUrl
    })

    xit(
      'should create a thumbnail of the specified image at the specified width',
      () => {}
    )
  })

  describe('dataURItoBlob', () => {
    it('should convert a data uri to a blob', () => {
      const blob = utils.dataURItoBlob(sampleImageDataURI, {})
      expect(blob instanceof Blob).toEqual(true)
      expect(blob.size).toEqual(9348)
      expect(blob.type).toEqual('image/jpeg')
    })
  })

  describe('dataURItoFile', () => {
    it('should convert a data uri to a file', () => {
      const file = utils.dataURItoFile(sampleImageDataURI, { name: 'foo.jpg' })
      expect(file instanceof File).toEqual(true)
      expect(file.size).toEqual(9348)
      expect(file.type).toEqual('image/jpeg')
      expect(file.name).toEqual('foo.jpg')
    })
  })

  describe('getSpeed', () => {
    it('should calculate the speed given a fileProgress object', () => {
      const dateNow = new Date()
      const date5SecondsAgo = new Date(dateNow.getTime() - 5 * 1000)
      const fileProgress = {
        bytesUploaded: 1024,
        uploadStarted: date5SecondsAgo
      }
      expect(Math.round(utils.getSpeed(fileProgress))).toEqual(Math.round(205))
    })
  })

  describe('getBytesRemaining', () => {
    it('should calculate the bytes remaining given a fileProgress object', () => {
      const fileProgress = {
        bytesUploaded: 1024,
        bytesTotal: 3096
      }
      expect(utils.getBytesRemaining(fileProgress)).toEqual(2072)
    })
  })

  describe('getETA', () => {
    it('should get the ETA remaining based on a fileProgress object', () => {
      const dateNow = new Date()
      const date5SecondsAgo = new Date(dateNow.getTime() - 5 * 1000)
      const fileProgress = {
        bytesUploaded: 1024,
        bytesTotal: 3096,
        uploadStarted: date5SecondsAgo
      }
      expect(utils.getETA(fileProgress)).toEqual(10.1)
    })
  })

  describe('prettyETA', () => {
    it('should convert the specified number of seconds to a pretty ETA', () => {
      expect(utils.prettyETA(0)).toEqual('0s')
      expect(utils.prettyETA(1.2)).toEqual('1s')
      expect(utils.prettyETA(1)).toEqual('1s')
      expect(utils.prettyETA(103)).toEqual('1m 43s')
      expect(utils.prettyETA(1034.9)).toEqual('17m 14s')
      expect(utils.prettyETA(103984.1)).toEqual('4h 53m 04s')
    })
  })

  describe('copyToClipboard', () => {
    xit('should copy the specified text to the clipboard', () => {})
  })

  describe('getSocketHost', () => {
    it('should get the host from the specified url', () => {
      expect(
        utils.getSocketHost('https://foo.bar/a/b/cd?e=fghi&l=k&m=n')
      ).toEqual('ws://foo.bar/a/b/cd?e=fghi&l=k&m=n')
    })
  })

  describe('settle', () => {
    it('should resolve even if all input promises reject', () => {
      return expect(
        utils.settle([
          Promise.reject(new Error('oops')),
          Promise.reject(new Error('this went wrong'))
        ])
      ).resolves.toMatchObject({
        successful: [],
        failed: [{ message: 'oops' }, { message: 'this went wrong' }]
      })
    })

    it('should resolve with an object if some input promises resolve', () => {
      return expect(
        utils.settle([
          Promise.reject(new Error('rejected')),
          Promise.resolve('resolved'),
          Promise.resolve('also-resolved')
        ])
      ).resolves.toMatchObject({
        successful: ['resolved', 'also-resolved'],
        failed: [{ message: 'rejected' }]
      })
    })
  })

  describe('limitPromises', () => {
    let pending = 0
    function fn () {
      pending++
      return new Promise((resolve) => setTimeout(resolve, 10))
        .then(() => pending--)
    }

    it('should run at most N promises at the same time', () => {
      const limit = utils.limitPromises(4)
      const fn2 = limit(fn)

      const result = Promise.all([
        fn2(), fn2(), fn2(), fn2(),
        fn2(), fn2(), fn2(), fn2(),
        fn2(), fn2()
      ])

      expect(pending).toBe(4)
      setTimeout(() => {
        expect(pending).toBe(4)
      }, 10)

      return result.then(() => {
        expect(pending).toBe(0)
      })
    })

    it('should accept Infinity as limit', () => {
      const limit = utils.limitPromises(Infinity)
      const fn2 = limit(fn)

      const result = Promise.all([
        fn2(), fn2(), fn2(), fn2(),
        fn2(), fn2(), fn2(), fn2(),
        fn2(), fn2()
      ])

      expect(pending).toBe(10)

      return result.then(() => {
        expect(pending).toBe(0)
      })
    })
  })
})
