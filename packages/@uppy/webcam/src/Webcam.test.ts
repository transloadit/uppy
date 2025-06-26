import Uppy from '@uppy/core'
import { describe, expect, it } from 'vitest'
import Webcam from './index.js'

describe('Webcam', () => {
  describe('_getMediaRecorderOptions', () => {
    it('should not have a mimeType set if no preferences given', () => {
      // @ts-ignore
      globalThis.MediaRecorder = {
        isTypeSupported: () => true,
      }

      const uppy = new Uppy<any, any>().use(Webcam)
      expect(
        (uppy.getPlugin('Webcam') as Webcam<any, any>).getMediaRecorderOptions()
          .mimeType,
      ).not.toBeDefined()
    })

    it('should use preferredVideoMimeType', () => {
      // @ts-ignore
      globalThis.MediaRecorder = {
        isTypeSupported: (ty) => ty === 'video/webm',
      }

      const uppy = new Uppy().use(Webcam, {
        preferredVideoMimeType: 'video/webm',
      })
      expect(
        (uppy.getPlugin('Webcam') as Webcam<any, any>).getMediaRecorderOptions()
          .mimeType,
      ).toEqual('video/webm')
    })

    it('should not use preferredVideoMimeType if it is not supported', () => {
      // @ts-ignore
      globalThis.MediaRecorder = {
        isTypeSupported: (ty) => ty === 'video/webm',
      }

      const uppy = new Uppy().use(Webcam, {
        preferredVideoMimeType: 'video/mp4',
      })
      expect(
        (uppy.getPlugin('Webcam') as Webcam<any, any>).getMediaRecorderOptions()
          .mimeType,
      ).not.toBeDefined()
    })

    it('should pick type based on `allowedFileTypes`', () => {
      // @ts-ignore
      globalThis.MediaRecorder = {
        isTypeSupported: () => true,
      }

      const uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] },
      }).use(Webcam)
      expect(
        (uppy.getPlugin('Webcam') as Webcam<any, any>).getMediaRecorderOptions()
          .mimeType,
      ).toEqual('video/mp4')
    })

    it('should use first supported type from allowedFileTypes', () => {
      // @ts-ignore
      globalThis.MediaRecorder = {
        isTypeSupported: (ty) => ty === 'video/webm',
      }

      const uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] },
      }).use(Webcam)
      expect(
        (uppy.getPlugin('Webcam') as Webcam<any, any>).getMediaRecorderOptions()
          .mimeType,
      ).toEqual('video/webm')
    })

    it('should prefer preferredVideoMimeType over allowedFileTypes', () => {
      // @ts-ignore
      globalThis.MediaRecorder = {
        isTypeSupported: () => true,
      }

      const uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] },
      }).use(Webcam, {
        preferredVideoMimeType: 'video/webm',
      })
      expect(
        (uppy.getPlugin('Webcam') as Webcam<any, any>).getMediaRecorderOptions()
          .mimeType,
      ).toEqual('video/webm')
    })

    it('should not use allowedFileTypes if they are unsupported', () => {
      // @ts-ignore
      globalThis.MediaRecorder = {
        isTypeSupported: () => false,
      }

      const uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] },
      }).use(Webcam)
      expect(
        (uppy.getPlugin('Webcam') as Webcam<any, any>).getMediaRecorderOptions()
          .mimeType,
      ).toEqual(undefined)
    })
  })
})
