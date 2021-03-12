const Uppy = require('@uppy/core')
const Webcam = require('./index')

describe('Webcam', () => {
  describe('_getMediaRecorderOptions', () => {
    it('should not have a mimeType set if no preferences given', () => {
      global.MediaRecorder = {
        isTypeSupported: () => true
      }

      const uppy = new Uppy().use(Webcam)
      expect(
        uppy.getPlugin('Webcam')._getMediaRecorderOptions().mimeType
      ).not.toBeDefined()
    })

    it('should use preferredVideoMimeType', () => {
      global.MediaRecorder = {
        isTypeSupported: (ty) => ty === 'video/webm'
      }

      const uppy = new Uppy().use(Webcam, { preferredVideoMimeType: 'video/webm' })
      expect(
        uppy.getPlugin('Webcam')._getMediaRecorderOptions().mimeType
      ).toEqual('video/webm')
    })

    it('should not use preferredVideoMimeType if it is not supported', () => {
      global.MediaRecorder = {
        isTypeSupported: (ty) => ty === 'video/webm'
      }

      const uppy = new Uppy().use(Webcam, { preferredVideoMimeType: 'video/mp4' })
      expect(
        uppy.getPlugin('Webcam')._getMediaRecorderOptions().mimeType
      ).not.toBeDefined()
    })

    it('should pick type based on `allowedFileTypes`', () => {
      global.MediaRecorder = {
        isTypeSupported: () => true
      }

      const uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] }
      }).use(Webcam)
      expect(
        uppy.getPlugin('Webcam')._getMediaRecorderOptions().mimeType
      ).toEqual('video/mp4')
    })

    it('should use first supported type from allowedFileTypes', () => {
      global.MediaRecorder = {
        isTypeSupported: (ty) => ty === 'video/webm'
      }

      const uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] }
      }).use(Webcam)
      expect(
        uppy.getPlugin('Webcam')._getMediaRecorderOptions().mimeType
      ).toEqual('video/webm')
    })

    it('should prefer preferredVideoMimeType over allowedFileTypes', () => {
      global.MediaRecorder = {
        isTypeSupported: () => true
      }

      const uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] }
      })
        .use(Webcam, { preferredVideoMimeType: 'video/webm' })
      expect(
        uppy.getPlugin('Webcam')._getMediaRecorderOptions().mimeType
      ).toEqual('video/webm')
    })

    it('should not use allowedFileTypes if they are unsupported', () => {
      global.MediaRecorder = {
        isTypeSupported: () => false
      }

      const uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] }
      }).use(Webcam)
      expect(
        uppy.getPlugin('Webcam')._getMediaRecorderOptions().mimeType
      ).toEqual(undefined)
    })
  })
})
