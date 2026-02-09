import Core from '@uppy/core'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { describe, expect, it, vi } from 'vitest'
import Transloadit from './index.ts'
import 'whatwg-fetch'

// Mock EventSource for testing
global.EventSource = vi.fn(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
}))

describe('Transloadit', () => {
  it('Does not leave lingering progress if getAssemblyOptions fails', () => {
    const error = new Error('expected failure')
    const uppy = new Core()
    uppy.use(Transloadit, {
      assemblyOptions() {
        return Promise.reject(error)
      },
    })

    uppy.addFile({
      source: 'test',
      name: 'abc',
      data: new Uint8Array(100),
    })

    return uppy
      .upload()
      .then(() => {
        throw new Error('Should not have succeeded')
      })
      .catch((err) => {
        const fileID = Object.keys(uppy.getState().files)[0]

        expect(err).toBe(error)
        expect(uppy.getFile(fileID).progress.uploadStarted).toBe(null)
      })
  })

  it('Does not leave lingering progress if creating assembly fails', () => {
    const uppy = new Core()
    uppy.use(Transloadit, {
      assemblyOptions: {
        params: {
          auth: { key: 'some auth key string' },
          template_id: 'some template id string',
        },
      },
    })

    uppy.getPlugin('Transloadit').client.createAssembly = () =>
      Promise.reject(new Error('VIDEO_ENCODE_VALIDATION'))

    uppy.addFile({
      source: 'test',
      name: 'abc',
      data: new Uint8Array(100),
    })

    return uppy.upload().then(
      () => {
        throw new Error('Should not have succeeded')
      },
      (err) => {
        const fileID = Object.keys(uppy.getState().files)[0]

        expect(err.message).toBe(
          'Transloadit: Could not create Assembly: VIDEO_ENCODE_VALIDATION',
        )
        expect(uppy.getFile(fileID).progress.uploadStarted).toBe(null)
      },
    )
  })

  it('should complete when resuming after pause', async () => {
    const assemblyStatusBase = {
      assembly_id: 'test-assembly-id',
      websocket_url: 'ws://localhost:8080',
      tus_url: 'http://localhost/resumable/files/',
      assembly_ssl_url:
        'https://api2.transloadit.com/assemblies/test-assembly-id',
    }

    const tusUploads = new Map()
    let uploadIndex = 0
    const tusBaseUrl = 'http://localhost/resumable/files/'

    const server = setupServer(
      http.options('http://localhost/resumable/files*', () => {
        return new HttpResponse(null, {
          status: 204,
          headers: {
            'Tus-Resumable': '1.0.0',
            'Tus-Version': '1.0.0',
            'Tus-Extension': 'creation,creation-defer-length',
          },
        })
      }),
      http.post('http://localhost/resumable/files*', ({ request }) => {
        const uploadLengthHeader = request.headers.get('upload-length')
        const uploadLength = uploadLengthHeader ? Number(uploadLengthHeader) : 0
        const uploadId = `test-upload-${uploadIndex++}`
        tusUploads.set(uploadId, {
          length: Number.isNaN(uploadLength) ? 0 : uploadLength,
          offset: 0,
        })

        return new HttpResponse(null, {
          status: 201,
          headers: {
            Location: `${tusBaseUrl}${uploadId}`,
            'Upload-Offset': '0',
            'Tus-Resumable': '1.0.0',
          },
        })
      }),
      http.head('http://localhost/resumable/files/:uploadId', ({ params }) => {
        const upload = tusUploads.get(params.uploadId)
        if (!upload) {
          return new HttpResponse(null, { status: 404 })
        }
        return new HttpResponse(null, {
          status: 200,
          headers: {
            'Upload-Offset': String(upload.offset),
            'Upload-Length': String(upload.length),
            'Tus-Resumable': '1.0.0',
          },
        })
      }),
      http.patch(
        'http://localhost/resumable/files/:uploadId',
        async ({ request, params }) => {
          const upload = tusUploads.get(params.uploadId)
          if (!upload) {
            return new HttpResponse(null, { status: 404 })
          }
          if (upload.offset === 0) {
            await new Promise((resolve) => setTimeout(resolve, 200))
          }
          const body = await request.arrayBuffer()
          const offsetHeader = request.headers.get('upload-offset')
          const baseOffset = offsetHeader ? Number(offsetHeader) : upload.offset
          const nextOffset = baseOffset + body.byteLength
          upload.offset = nextOffset

          return new HttpResponse(null, {
            status: 204,
            headers: {
              'Upload-Offset': String(nextOffset),
              'Tus-Resumable': '1.0.0',
            },
          })
        },
      ),
      http.post('https://api2.transloadit.com/assemblies', ({ request }) => {
        return HttpResponse.json({
          ...assemblyStatusBase,
          ok: 'ASSEMBLY_EXECUTING',
        })
      }),
      http.get('https://api2.transloadit.com/assemblies/*', () => {
        return HttpResponse.json({
          ...assemblyStatusBase,
          ok: 'ASSEMBLY_COMPLETED',
          results: {},
        })
      }),
      http.post('https://transloaditstatus.com/client_error', () => {
        return HttpResponse.json({})
      }),
    )

    server.listen({ onUnhandledRequest: 'error' })

    const uppy = new Core()
    const successSpy = vi.fn()
    uppy.on('complete', successSpy)
    uppy.use(Transloadit, {
      assemblyOptions: {
        params: {
          auth: { key: 'test-auth-key' },
          template_id: 'test-template-id',
        },
      },
    })

    uppy.addFile({
      source: 'test',
      name: 'cat.jpg',
      data: new File([new Uint8Array([1, 2, 3, 4, 5])], 'cat.jpg', {
        type: 'image/jpeg',
      }),
    })
    uppy.addFile({
      source: 'test',
      name: 'traffic.jpg',
      data: new File([new Uint8Array([6, 7, 8, 9, 10, 11])], 'traffic.jpg', {
        type: 'image/jpeg',
      }),
    })

    // Initially should be true
    expect(uppy.getState().allowNewUpload).toBe(true)

    const uploadPromise = uppy.upload()

    // Should be set to false during upload
    expect(uppy.getState().allowNewUpload).toBe(false)

    await new Promise((resolve) => setTimeout(resolve, 100))
    uppy.pauseAll()
    uppy.resumeAll()

    await uploadPromise

    expect(successSpy).toHaveBeenCalled()

    // Should be reset to true after upload completes
    expect(uppy.getState().allowNewUpload).toBe(true)

    server.close()
  })

  it('resets allowNewUpload to true on preprocessor error', async () => {
    const uppy = new Core()
    uppy.use(Transloadit, {
      assemblyOptions: {
        params: {
          auth: { key: 'test-auth-key' },
          template_id: 'test-template-id',
        },
      },
    })

    // Mock createAssembly to throw an error
    uppy.getPlugin('Transloadit').client.createAssembly = () =>
      Promise.reject(new Error('Assembly creation failed'))

    uppy.addFile({
      source: 'test',
      name: 'test.jpg',
      data: Buffer.from('test file content'),
    })

    // Initially should be true
    expect(uppy.getState().allowNewUpload).toBe(true)

    try {
      await uppy.upload()
    } catch {
      // Expected to fail
    }

    // Should be reset to true after error
    expect(uppy.getState().allowNewUpload).toBe(true)
  })

  it('resets allowNewUpload to true on cancel-all', async () => {
    const uppy = new Core()
    uppy.use(Transloadit, {
      assemblyOptions: {
        params: {
          auth: { key: 'test-auth-key' },
          template_id: 'test-template-id',
        },
      },
    })

    // Manually set allowNewUpload to false to simulate an upload in progress
    uppy.setState({ allowNewUpload: false })
    expect(uppy.getState().allowNewUpload).toBe(false)

    // Simulate cancel-all
    uppy.cancelAll()

    // Should be reset to true
    expect(uppy.getState().allowNewUpload).toBe(true)
  })

  it('resets allowNewUpload to true on error event', () => {
    const uppy = new Core()
    uppy.use(Transloadit, {
      assemblyOptions: {
        params: {
          auth: { key: 'test-auth-key' },
          template_id: 'test-template-id',
        },
      },
    })

    // Manually set allowNewUpload to false to simulate an upload in progress
    uppy.setState({ allowNewUpload: false })
    expect(uppy.getState().allowNewUpload).toBe(false)

    // Trigger error event
    uppy.emit('error', {
      name: 'TestError',
      message: 'Test error message',
    })

    // Should be reset to true
    expect(uppy.getState().allowNewUpload).toBe(true)
  })
})
