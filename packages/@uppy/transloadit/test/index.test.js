import Core from '@uppy/core'
import Transloadit from '@uppy/transloadit'
import { HttpResponse, http } from 'msw'
import { describe, expect, vi } from 'vitest'
import { it } from './test-extend.ts'

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

  it('should complete when resuming after pause', async ({ worker }) => {
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

    worker.use(
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
      http.post('https://api2.transloadit.com/assemblies', () => {
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

    // Plugin state should start empty; track every distinct `ok` that lands in
    // it so we can verify the assembly lifecycle is reflected.
    expect(uppy.getState().plugins.Transloadit.assemblyStatus).toBeUndefined()
    const okHistory = []
    const unsubscribe = uppy.store.subscribe((_prev, next) => {
      const ok = next.plugins.Transloadit.assemblyStatus?.ok
      if (ok && ok !== okHistory.at(-1)) okHistory.push(ok)
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

    // Trying to add a new file during upload with Transloadit should not be possible
    expect(() =>
      uppy.addFile({
        source: 'test',
        name: 'additionalFile.jpg',
        data: new File([new Uint8Array([0])], 'additionalFile.jpg', {
          type: 'image/jpeg',
        }),
      }),
    ).toThrowError('Cannot add more files')

    await new Promise((resolve) => setTimeout(resolve, 100))
    uppy.pauseAll()
    uppy.resumeAll()

    await uploadPromise
    unsubscribe()

    expect(successSpy).toHaveBeenCalled()

    // Should be reset to true after upload completes
    expect(uppy.getState().allowNewUpload).toBe(true)

    // The createAssembly mock returned ASSEMBLY_EXECUTING and the assembly
    // setter forwarded that status into plugin state during the upload.
    expect(okHistory).toContain('ASSEMBLY_EXECUTING')
    // `assemblyStatus` is the live slot — it clears when `this.assembly`
    // becomes undefined at the end of `#afterUpload`. `lastAssembly` is
    // intentionally not populated here because no terminal event fires in
    // this mocked flow (the server keeps returning ASSEMBLY_EXECUTING).
    expect(uppy.getState().plugins.Transloadit.assemblyStatus).toBeUndefined()
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
      data: new Blob(['test file content']),
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

  it('fails a retried file and allows new uploads when fetching Assembly options fails', async () => {
    const uppy = new Core()
    uppy.use(Transloadit, {
      assemblyOptions: () => Promise.reject(new Error('signing unavailable')),
    })
    const id = uppy.addFile({
      source: 'test',
      name: 'abc',
      data: new Uint8Array(100),
    })
    uppy.setFileState(id, { error: 'earlier failure' })

    // Unlike upload(), a retry has no error event to fall back on.
    await expect(uppy.retryUpload(id)).rejects.toThrow('signing unavailable')

    expect(uppy.getFile(id).error).toBe('signing unavailable')
    expect(uppy.getState().allowNewUpload).toBe(true)
  })

  it('leaves no Assembly behind for an upload cancelled while its options were fetched', async () => {
    const signing = Promise.withResolvers()
    const uppy = new Core()
    uppy.use(Transloadit, { assemblyOptions: () => signing.promise })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(async () => ({
      assembly_id: 'stale',
      ok: 'ASSEMBLY_UPLOADING',
      assembly_ssl_url: 'https://api2.transloadit.com/assemblies/stale',
      tus_url: 'https://api2.transloadit.com/resumable/files/',
      websocket_url: 'https://api2.transloadit.com/ws',
      uploads: [],
      results: {},
    }))
    plugin.client.cancelAssembly = vi.fn(async () => {})
    const file = { source: 'test', name: 'same.txt', data: new Blob(['same']) }
    const id = uppy.addFile(file)

    const upload = uppy.upload()
    uppy.cancelAll()
    // Added again, the same file has the same id as the one just removed.
    expect(uppy.addFile(file)).toBe(id)
    signing.resolve({
      params: {
        auth: { key: 'test-auth-key' },
        template_id: 'test-template-id',
      },
    })
    await upload

    // Nothing for the next batch to reuse, and the new file is not bound to it.
    expect(plugin.client.createAssembly).not.toHaveBeenCalled()
    expect(plugin.assembly).toBeUndefined()
    expect(uppy.getFile(id).transloadit).toBeUndefined()
    expect(uppy.getState().allowNewUpload).toBe(true)
  })
})
