import { Uppy } from '@uppy/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Webcam from '../lib/index.js'

describe('Webcam', () => {
  describe('_getMediaRecorderOptions', () => {
    it('should not have a mimeType set if no preferences given', () => {
      // @ts-expect-error
      globalThis.MediaRecorder = {
        isTypeSupported: () => true,
      }

      using uppy = new Uppy().use(Webcam)
      expect(
        uppy.getPlugin('Webcam')?.getMediaRecorderOptions().mimeType,
      ).not.toBeDefined()
    })

    it('should use preferredVideoMimeType', () => {
      // @ts-expect-error
      globalThis.MediaRecorder = {
        isTypeSupported: (ty) => ty === 'video/webm',
      }

      using uppy = new Uppy().use(Webcam, {
        preferredVideoMimeType: 'video/webm',
      })
      expect(
        uppy.getPlugin('Webcam')?.getMediaRecorderOptions().mimeType,
      ).toEqual('video/webm')
    })

    it('should not use preferredVideoMimeType if it is not supported', () => {
      // @ts-expect-error
      globalThis.MediaRecorder = {
        isTypeSupported: (ty) => ty === 'video/webm',
      }

      using uppy = new Uppy().use(Webcam, {
        preferredVideoMimeType: 'video/mp4',
      })
      expect(
        uppy.getPlugin('Webcam')?.getMediaRecorderOptions().mimeType,
      ).not.toBeDefined()
    })

    it('should pick type based on `allowedFileTypes`', () => {
      // @ts-expect-error
      globalThis.MediaRecorder = {
        isTypeSupported: () => true,
      }

      using uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] },
      }).use(Webcam)
      expect(
        uppy.getPlugin('Webcam')?.getMediaRecorderOptions().mimeType,
      ).toEqual('video/mp4')
    })

    it('should use first supported type from allowedFileTypes', () => {
      // @ts-expect-error
      globalThis.MediaRecorder = {
        isTypeSupported: (ty) => ty === 'video/webm',
      }

      using uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] },
      }).use(Webcam)
      expect(
        uppy.getPlugin('Webcam')?.getMediaRecorderOptions().mimeType,
      ).toEqual('video/webm')
    })

    it('should prefer preferredVideoMimeType over allowedFileTypes', () => {
      // @ts-expect-error
      globalThis.MediaRecorder = {
        isTypeSupported: () => true,
      }

      using uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] },
      }).use(Webcam, {
        preferredVideoMimeType: 'video/webm',
      })
      expect(
        uppy.getPlugin('Webcam')?.getMediaRecorderOptions().mimeType,
      ).toEqual('video/webm')
    })

    it('should not use allowedFileTypes if they are unsupported', () => {
      // @ts-expect-error
      globalThis.MediaRecorder = {
        isTypeSupported: () => false,
      }

      using uppy = new Uppy({
        restrictions: { allowedFileTypes: ['video/mp4', 'video/webm'] },
      }).use(Webcam)
      expect(
        uppy.getPlugin('Webcam')?.getMediaRecorderOptions().mimeType,
      ).toEqual(undefined)
    })
  })

  describe('takeSnapshot', () => {
    it('can take a snapshot after onBeforeSnapshot rejects', async () => {
      const onBeforeSnapshot = vi
        .fn()
        .mockRejectedValueOnce(new Error('not now'))
        .mockResolvedValue(undefined)
      using uppy = new Uppy().use(Webcam, { onBeforeSnapshot })
      const webcam = uppy.getPlugin('Webcam')!
      webcam.getVideoElement = () => document.createElement('video')

      await expect(webcam.takeSnapshot()).rejects.toThrow('not now')
      await webcam.takeSnapshot()

      expect(webcam.getPluginState().capturedSnapshot).toMatch(/^blob:/)
    })
  })

  describe('start and stop', () => {
    const deferred = <T>() => {
      let resolve!: (value: T) => void
      const promise = new Promise<T>((r) => {
        resolve = r
      })
      return { promise, resolve }
    }

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('stops a stream that arrives after the camera was stopped', async () => {
      const stream = document.createElement('canvas').captureStream()
      const permission = deferred<MediaStream>()
      vi.spyOn(navigator.mediaDevices, 'enumerateDevices').mockResolvedValue([])
      vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockReturnValue(
        permission.promise,
      )
      using uppy = new Uppy().use(Webcam)
      const webcam = uppy.getPlugin('Webcam')!

      const started = webcam.start()
      await vi.waitFor(() =>
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled(),
      )
      await webcam.stop()
      permission.resolve(stream)
      await started

      expect(stream.getTracks().map((track) => track.readyState)).toEqual([
        'ended',
      ])
      expect(webcam.stream).toBeNull()
      expect(webcam.getPluginState().cameraReady).toBe(false)
    })

    it('does not ask for camera access after being stopped', async () => {
      const devices = deferred<MediaDeviceInfo[]>()
      vi.spyOn(navigator.mediaDevices, 'enumerateDevices').mockReturnValue(
        devices.promise,
      )
      const getUserMedia = vi
        .spyOn(navigator.mediaDevices, 'getUserMedia')
        .mockRejectedValue(new Error('denied'))
      using uppy = new Uppy().use(Webcam)
      const webcam = uppy.getPlugin('Webcam')!

      const started = webcam.start()
      await webcam.stop()
      devices.resolve([])
      await started

      expect(getUserMedia).not.toHaveBeenCalled()
    })

    it('stays ready while switching cameras', async () => {
      const streams: MediaStream[] = []
      vi.spyOn(navigator.mediaDevices, 'enumerateDevices').mockResolvedValue([
        { kind: 'videoinput', deviceId: 'cam-1' },
        { kind: 'videoinput', deviceId: 'cam-2' },
      ] as MediaDeviceInfo[])
      const getUserMedia = vi
        .spyOn(navigator.mediaDevices, 'getUserMedia')
        .mockImplementation(() => {
          const stream = document.createElement('canvas').captureStream()
          streams.push(stream)
          return Promise.resolve(stream)
        })
      using uppy = new Uppy().use(Webcam)
      const webcam = uppy.getPlugin('Webcam')!
      await webcam.start()
      expect(webcam.getPluginState().cameraReady).toBe(true)

      const readiness: boolean[] = []
      uppy.on('state-update', () => {
        readiness.push(webcam.getPluginState().cameraReady)
      })
      webcam.changeVideoSource('cam-2')
      await vi.waitFor(() => expect(webcam.stream).toBe(streams[1]))

      expect(readiness).not.toContain(false)
      expect(getUserMedia.mock.lastCall?.[0]?.video).toMatchObject({
        deviceId: 'cam-2',
      })
      expect(streams[0]!.getTracks()[0]!.readyState).toBe('ended')
    })
  })
})
