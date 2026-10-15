import { network } from 'virtual:msw'
import Core, { BasePlugin } from '@uppy/core'
import Transloadit from '@uppy/transloadit'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

network.configure({
  context: { quiet: true },
  // No test may reach Transloadit: a request no test handler answers fails.
  handlers: [
    http.all('https://api2.transloadit.com/*', () => HttpResponse.error()),
    http.all('https://transloaditstatus.com/*', () => HttpResponse.error()),
  ],
})
await network.enable()

afterEach(() => {
  network.resetHandlers()
})

/**
 * What a UI plugin renders: it renders the state of the last `update()`,
 * which may be older than `getState()`.
 */
class Rendered extends BasePlugin {
  id = 'Rendered'
  type = 'presenter'
  update(state) {
    this.state = state
  }
}

describe('Transloadit', () => {
  it('Does not leave lingering progress if getAssemblyOptions fails', async () => {
    const error = new Error('expected failure')
    using uppy = new Core()
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

    await expect(uppy.upload()).rejects.toBe(error)

    const fileID = Object.keys(uppy.getState().files)[0]

    expect(uppy.getFile(fileID).progress.uploadStarted).toBe(null)
  })

  it('Does not leave lingering progress if creating assembly fails', async () => {
    using uppy = new Core()
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

    await expect(uppy.upload()).rejects.toThrow(
      'Transloadit: Could not create Assembly: VIDEO_ENCODE_VALIDATION',
    )

    const fileID = Object.keys(uppy.getState().files)[0]

    expect(uppy.getFile(fileID).progress.uploadStarted).toBe(null)
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

    network.use(
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

    using uppy = new Core()
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
    using uppy = new Core()
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
    using uppy = new Core()
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
    using uppy = new Core()
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

  /** A status for the Assembly `id`, as Transloadit reports it while uploading. */
  const assemblyStatus = (id) => ({
    assembly_id: id,
    ok: 'ASSEMBLY_UPLOADING',
    assembly_ssl_url: `https://api2.transloadit.com/assemblies/${id}`,
    tus_url: 'https://api2.transloadit.com/resumable/files/',
    websocket_url: 'https://api2.transloadit.com/ws',
    uploads: [],
    results: {},
  })

  /** Lets an Assembly connect: no live updates, its status on every poll. */
  function serveAssemblies() {
    network.use(
      http.get(
        'https://api2.transloadit.com/ws',
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.get('https://api2.transloadit.com/assemblies/:id', ({ params }) =>
        HttpResponse.json(assemblyStatus(params.id)),
      ),
    )
  }

  /** One deferred `assemblyOptions()` per upload, answered by the test. */
  function deferredSignings(count) {
    const signings = Array.from({ length: count }, () =>
      Promise.withResolvers(),
    )
    const signer = {
      signings,
      calls: 0,
      assemblyOptions: () => signings[signer.calls++].promise,
    }
    return signer
  }

  it('cancels the Assembly of an upload cancelled while it was being created', async () => {
    const creating = Promise.withResolvers()
    const uppy = new Core()
    uppy.use(Transloadit, {
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(() => creating.promise)
    plugin.client.cancelAssembly = vi.fn(async () => {})
    const file = { source: 'test', name: 'same.txt', data: new Blob(['same']) }
    const id = uppy.addFile(file)

    const upload = uppy.upload()
    await vi.waitFor(() =>
      expect(plugin.client.createAssembly).toHaveBeenCalledOnce(),
    )
    uppy.cancelAll()
    // Added again, the same file has the same id as the one just removed.
    expect(uppy.addFile(file)).toBe(id)
    const status = assemblyStatus('A1')
    creating.resolve(status)
    await upload

    // Nothing for the next batch to reuse, and the new file is not bound to it.
    expect(plugin.client.cancelAssembly).toHaveBeenCalledWith(status)
    expect(plugin.assembly).toBeUndefined()
    expect(uppy.getFile(id).transloadit).toBeUndefined()
    expect(uppy.getState().allowNewUpload).toBe(true)
  })

  it('reports nothing for a cancelled attempt whose options fail, leaving a newer upload of the same file alone', async () => {
    const signer = deferredSignings(2)
    const { signings } = signer
    const uppy = new Core()
    uppy.use(Transloadit, { assemblyOptions: signer.assemblyOptions })
    const file = { source: 'test', name: 'same.txt', data: new Blob(['same']) }
    const id = uppy.addFile(file)

    const first = uppy.upload()
    uppy.cancelAll()
    expect(uppy.addFile(file)).toBe(id)
    const second = uppy.upload()
    await vi.waitFor(() => expect(signer.calls).toBe(2))
    signings[0].reject(new Error('signing unavailable'))
    await first

    // The file now belongs to the second upload, which is still preparing.
    expect(uppy.getFile(id).error).toBeFalsy()
    expect(uppy.getState().allowNewUpload).toBe(false)
    expect(Object.keys(uppy.getState().currentUploads)).toHaveLength(1)

    uppy.cancelAll()
    signings[1].resolve({ params: { auth: { key: 'k' }, template_id: 't' } })
    await second
  })

  it("leaves a newer upload's Assembly alone when cancelling one whose files were reserved", async () => {
    serveAssemblies()
    const uppy = new Core()
    uppy.use(Transloadit, {
      importFromUploadURLs: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    let created = 0
    plugin.client.createAssembly = vi.fn(async () =>
      assemblyStatus(`A${++created}`),
    )
    const reserving = Promise.withResolvers()
    plugin.client.reserveFile = vi
      .fn()
      .mockImplementationOnce(() => reserving.promise)
      .mockResolvedValue(undefined)
    plugin.client.cancelAssembly = vi.fn(async () => {})
    const cancelled = vi.fn()
    uppy.on('transloadit:assembly-cancelled', cancelled)
    // Keep the newer upload in its upload step, as a real uploader would.
    const uploading = Promise.withResolvers()
    uppy.addUploader(() => uploading.promise)
    const file = { source: 'test', name: 'same.txt', data: new Blob(['same']) }
    uppy.addFile(file)

    const first = uppy.upload()
    await vi.waitFor(() =>
      expect(plugin.client.reserveFile).toHaveBeenCalledOnce(),
    )
    uppy.cancelAll()
    uppy.addFile(file)
    const second = uppy.upload()
    await vi.waitFor(() =>
      expect(plugin.assembly?.status.assembly_id).toBe('A2'),
    )
    reserving.resolve()
    await first

    // A1 is cancelled on the server, and announced so as its creation was.
    const ids = (mock) => mock.mock.calls.map(([status]) => status.assembly_id)
    expect(ids(plugin.client.cancelAssembly)).toEqual(['A1'])
    expect(ids(cancelled)).toEqual(['A1'])
    expect(plugin.assembly?.status.assembly_id).toBe('A2')

    uppy.cancelAll()
    uploading.resolve()
    await second.catch(() => {})
  })

  it('cancels the Assembly of an upload whose reservation fails after it was cancelled', async () => {
    const uppy = new Core()
    uppy.use(Transloadit, {
      importFromUploadURLs: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(async () => assemblyStatus('A1'))
    const reserving = Promise.withResolvers()
    plugin.client.reserveFile = vi.fn(() => reserving.promise)
    plugin.client.cancelAssembly = vi.fn(async () => {})
    uppy.addFile({ source: 'test', name: 'a.txt', data: new Blob(['a']) })

    const upload = uppy.upload()
    await vi.waitFor(() =>
      expect(plugin.client.reserveFile).toHaveBeenCalledOnce(),
    )
    uppy.cancelAll()
    reserving.reject(new Error('reservation failed'))
    await upload

    expect(plugin.client.cancelAssembly).toHaveBeenCalledOnce()
    expect(plugin.client.cancelAssembly.mock.calls[0][0].assembly_id).toBe('A1')
    expect(plugin.assembly).toBeUndefined()
  })

  it("keeps a running retry's Assembly when an upload's options fail", async () => {
    serveAssemblies()
    const signer = deferredSignings(2)
    const { signings } = signer
    const uppy = new Core()
    uppy.use(Transloadit, {
      // The test's uploader instead of Transloadit's own Tus one.
      importFromUploadURLs: true,
      assemblyOptions: signer.assemblyOptions,
    })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(async () => assemblyStatus('R1'))
    plugin.client.reserveFile = vi.fn(async () => {})
    plugin.client.cancelAssembly = vi.fn(async () => {})
    // The failure is reported to Transloadit; not under test here.
    plugin.client.submitError = vi.fn(async () => {})
    const uploading = Promise.withResolvers()
    uppy.addUploader(() => uploading.promise)
    uppy.addFile({ source: 'test', name: 'new.txt', data: new Blob(['new']) })
    const failed = uppy.addFile({
      source: 'test',
      name: 'failed.txt',
      data: new Blob(['failed']),
    })
    // Uploaded once before, so upload() leaves it out.
    uppy.setFileState(failed, {
      progress: { ...uppy.getFile(failed).progress, uploadStarted: 1 },
    })

    const upload = uppy.upload()
    await vi.waitFor(() => expect(signer.calls).toBe(1))
    uppy.setFileState(failed, { error: 'earlier failure' })
    const retry = uppy.retryUpload(failed)
    await vi.waitFor(() => expect(signer.calls).toBe(2))
    signings[1].resolve({ params: { auth: { key: 'k' }, template_id: 't' } })
    await vi.waitFor(() =>
      expect(plugin.assembly?.status.assembly_id).toBe('R1'),
    )
    const running = plugin.assembly

    // upload() fails, and core reports that again once it drops the upload.
    signings[0].reject(new Error('signing unavailable'))
    await expect(upload).rejects.toThrow('signing unavailable')

    expect(plugin.assembly).toBe(running)
    expect(running.closed).toBe(false)
    expect(uppy.getState().allowNewUpload).toBe(false)

    uppy.cancelAll()
    uploading.resolve()
    await retry.catch(() => {})
  })

  it('creates no Assembly for an upload without files cancelled while its options were fetched', async () => {
    const signing = Promise.withResolvers()
    const uppy = new Core()
    uppy.use(Transloadit, { assemblyOptions: () => signing.promise })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(async () => assemblyStatus('A1'))

    // A Template that imports its own inputs uploads no files.
    const upload = uppy.upload()
    await vi.waitFor(() => expect(uppy.getState().allowNewUpload).toBe(false))
    // With no files to remove, cancelAll() leaves the upload in place.
    uppy.cancelAll()
    signing.resolve({ params: { auth: { key: 'k' }, template_id: 't' } })
    await upload.catch(() => {})

    expect(plugin.client.createAssembly).not.toHaveBeenCalled()
    expect(plugin.assembly).toBeUndefined()
  })

  /**
   * An upload without files waits for its signing, is cancelled (core keeps
   * it in `currentUploads`), and a newer upload of `b.txt` starts. The
   * uploader holds files until `release()`; an upload without files passes.
   */
  async function cancelFilelessThenUploadAgain() {
    serveAssemblies()
    const signer = deferredSignings(2)
    const uppy = new Core()
    uppy.use(Transloadit, {
      // The test's uploader instead of Transloadit's own Tus one.
      importFromUploadURLs: true,
      assemblyOptions: signer.assemblyOptions,
    })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(async () => assemblyStatus('A2'))
    plugin.client.reserveFile = vi.fn(async () => {})
    const held = Promise.withResolvers()
    uppy.addUploader((fileIDs) =>
      fileIDs.length > 0 ? held.promise : Promise.resolve(),
    )

    const fileless = uppy.upload()
    await vi.waitFor(() => expect(signer.calls).toBe(1))
    uppy.cancelAll()
    uppy.addFile({ source: 'test', name: 'b.txt', data: new Blob(['b']) })
    const newer = uppy.upload()
    await vi.waitFor(() => expect(signer.calls).toBe(2))
    signer.signings[1].resolve({
      params: { auth: { key: 'k' }, template_id: 't' },
    })
    await vi.waitFor(() =>
      expect(plugin.assembly?.status.assembly_id).toBe('A2'),
    )
    const settleFileless = () => {
      signer.signings[0].resolve({
        params: { auth: { key: 'k' }, template_id: 't' },
      })
      return fileless.catch(() => {})
    }
    return { uppy, plugin, newer, release: held.resolve, settleFileless }
  }

  it('allows new uploads after a newer batch ends while a cancelled upload without files still waits for signing', async () => {
    const { uppy, plugin, newer, release, settleFileless } =
      await cancelFilelessThenUploadAgain()
    const running = plugin.assembly

    release()
    await newer

    // The cancelled upload is still signing, but it no longer counts.
    expect(uppy.getState().allowNewUpload).toBe(true)

    await settleFileless()
    running.close()
  })

  it("leaves a newer upload's Assembly alone when a cancelled upload without files resumes", async () => {
    const { plugin, newer, release, settleFileless } =
      await cancelFilelessThenUploadAgain()
    const running = plugin.assembly

    // Its signing settles: core still runs its later steps.
    await settleFileless()

    expect(plugin.assembly).toBe(running)
    expect(running.closed).toBe(false)

    release()
    await newer
    running.close()
  })

  it('lets go of the Assembly and allows new uploads after a retry whose uploader rejects before reporting its files', async () => {
    serveAssemblies()
    const uppy = new Core()
    uppy.use(Transloadit, {
      // The test's uploader instead of Transloadit's own Tus one.
      importFromUploadURLs: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(async () => assemblyStatus('A1'))
    plugin.client.reserveFile = vi.fn(async () => {})
    // Like XHRUpload with `bundle: true` whose `endpoint()` rejects: no file
    // is reported, so no `upload-error` or `error` event.
    let running
    uppy.addUploader(async () => {
      running = plugin.assembly
      throw new Error('upload failed')
    })
    const failed = uppy.addFile({
      source: 'test',
      name: 'failed.txt',
      data: new Blob(['failed']),
    })
    uppy.setFileState(failed, { error: 'earlier failure' })
    uppy.use(Rendered)

    await expect(uppy.retryUpload(failed)).rejects.toThrow('upload failed')

    // Nothing else runs, and core dropped the retry without another event.
    expect(uppy.getState().currentUploads).toEqual({})
    expect(uppy.getState().allowNewUpload).toBe(true)
    // Nor another update: the Dashboard would keep hiding "Add more".
    expect(uppy.getPlugin('Rendered').state.allowNewUpload).toBe(true)
    // Its Assembly goes with it: the next upload gets one of its own.
    expect(running.closed).toBe(true)
    expect(plugin.assembly).toBeUndefined()
  })

  it("leaves a newer upload's Assembly alone when a cancelled one fails late", async () => {
    serveAssemblies()
    const uppy = new Core()
    uppy.use(Transloadit, {
      // The test's uploader instead of Transloadit's own Tus one.
      importFromUploadURLs: true,
      waitForEncoding: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    let created = 0
    plugin.client.createAssembly = vi.fn(async () =>
      assemblyStatus(`A${++created}`),
    )
    plugin.client.reserveFile = vi.fn(async () => {})
    plugin.client.cancelAssembly = vi.fn(async () => {})
    // The failure is reported to Transloadit; not under test here.
    plugin.client.submitError = vi.fn(async () => {})
    uppy.addUploader(async () => {})
    const encoding = vi.fn()
    uppy.on('postprocess-progress', encoding)
    uppy.addFile({ source: 'test', name: 'a.txt', data: new Blob(['a']) })
    const first = uppy.upload()
    // Uploaded, and waiting for its Assembly.
    await vi.waitFor(() => expect(encoding).toHaveBeenCalled())
    const old = plugin.assembly
    uppy.cancelAll()
    // Cancelled: nothing of it is awaited any more, so it stops updating,
    // and the upload waiting for it ends.
    expect(old.closed).toBe(true)
    await first
    uppy.addFile({ source: 'test', name: 'b.txt', data: new Blob(['b']) })
    const second = uppy.upload()
    await vi.waitFor(() =>
      expect(plugin.assembly?.status.assembly_id).toBe('A2'),
    )
    const running = plugin.assembly

    // A status request of the cancelled Assembly fails.
    uppy.emit('transloadit:assembly-error', old.status, new Error('late'))
    await new Promise((resolve) => setTimeout(resolve))

    expect(plugin.assembly).toBe(running)
    expect(running.closed).toBe(false)
    expect(uppy.getState().allowNewUpload).toBe(false)

    uppy.cancelAll()
    await second
  })

  it("allows new uploads once an upload's only file is removed while its options are fetched", async () => {
    const signing = Promise.withResolvers()
    const uppy = new Core()
    uppy.use(Transloadit, { assemblyOptions: () => signing.promise })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn()
    const id = uppy.addFile({
      source: 'test',
      name: 'a.txt',
      data: new Blob(['a']),
    })
    // Uploaded before, so upload() leaves it out; it stays in Uppy, so core
    // does not reset the upload state when the other file goes.
    const earlier = uppy.addFile({
      source: 'test',
      name: 'earlier.txt',
      data: new Blob(['earlier']),
    })
    uppy.setFileState(earlier, {
      progress: { ...uppy.getFile(earlier).progress, uploadStarted: 1 },
    })

    uppy.use(Rendered)

    const upload = uppy.upload()
    await vi.waitFor(() => expect(uppy.getState().allowNewUpload).toBe(false))
    // Removing its only file drops the upload: nothing runs any more. Core
    // does not reopen admission here (a file is left), the plugin does,
    // once the removal's update is done.
    uppy.removeFile(id)
    await vi.waitFor(() => expect(uppy.getState().allowNewUpload).toBe(true))
    expect(uppy.getPlugin('Rendered').state.allowNewUpload).toBe(true)
    signing.resolve({ params: { auth: { key: 'k' }, template_id: 't' } })
    await upload

    // The dropped attempt still creates nothing.
    expect(plugin.client.createAssembly).not.toHaveBeenCalled()
    expect(uppy.getState().allowNewUpload).toBe(true)
  })

  it('lets a retry create its own Assembly after a restored one could not reserve its files', async () => {
    serveAssemblies()
    const uppy = new Core()
    uppy.use(Transloadit, {
      importFromUploadURLs: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(async () => assemblyStatus('A1'))
    // The restored Assembly rejects every reservation.
    plugin.client.reserveFile = vi.fn(async ({ assembly_id }) => {
      if (assembly_id === 'R1') throw new Error('reservation rejected')
    })
    // The failure is reported to Transloadit; not under test here.
    plugin.client.submitError = vi.fn(async () => {})
    uppy.addUploader(async () => {})
    const id = uppy.addFile({
      source: 'test',
      name: 'a.txt',
      data: new Blob(['a']),
    })
    // Recovered with Golden Retriever: set up before any upload runs.
    uppy.emit('restored', {
      Transloadit: { assemblyResponse: assemblyStatus('R1') },
    })
    await plugin.restored
    const restored = plugin.assembly

    await expect(uppy.upload()).rejects.toThrow('reservation rejected')

    // The failed upload lets go of it, so the retry does not run into the
    // same rejection again and again.
    expect(restored.closed).toBe(true)
    expect(plugin.assembly).toBeUndefined()
    await uppy.retryUpload(id)
    expect(plugin.client.createAssembly).toHaveBeenCalledOnce()
    expect(uppy.getFile(id).error).toBeFalsy()
  })

  it("keeps a waiting batch's Assembly when another upload() is refused meanwhile", async () => {
    serveAssemblies()
    const uppy = new Core()
    uppy.use(Transloadit, {
      // The test's uploader instead of Transloadit's own Tus one.
      importFromUploadURLs: true,
      waitForEncoding: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(async () => assemblyStatus('A1'))
    plugin.client.reserveFile = vi.fn(async () => {})
    // The refusal is reported to Transloadit; not under test here.
    plugin.client.submitError = vi.fn(async () => {})
    uppy.addUploader(async () => {})
    const encoding = vi.fn()
    uppy.on('postprocess-progress', encoding)
    uppy.addFile({ source: 'test', name: 'a.txt', data: new Blob(['a']) })
    const upload = uppy.upload()
    // Uploaded, and waiting for its Assembly.
    await vi.waitFor(() => expect(encoding).toHaveBeenCalled())
    const running = plugin.assembly

    // Core refuses it with an `error` event, which is not the batch's.
    await expect(uppy.upload()).rejects.toThrow('Cannot create a new upload')

    expect(plugin.assembly).toBe(running)
    expect(running.closed).toBe(false)
    expect(uppy.getState().allowNewUpload).toBe(false)

    uppy.emit('transloadit:complete', running.status)
    await upload
    expect(running.closed).toBe(true)
    expect(uppy.getState().allowNewUpload).toBe(true)
  })

  it('gives a retry its own Assembly while another upload is running', async () => {
    serveAssemblies()
    const uppy = new Core()
    uppy.use(Transloadit, {
      // The test's uploader instead of Transloadit's own Tus one.
      importFromUploadURLs: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    let created = 0
    plugin.client.createAssembly = vi.fn(async () =>
      assemblyStatus(`A${++created}`),
    )
    plugin.client.reserveFile = vi.fn(async () => {})
    // Holds the upload; the retry passes.
    const uploading = Promise.withResolvers()
    const newer = uppy.addFile({
      source: 'test',
      name: 'new.txt',
      data: new Blob(['new']),
    })
    uppy.addUploader((fileIDs) =>
      fileIDs.includes(newer) ? uploading.promise : Promise.resolve(),
    )
    const failed = uppy.addFile({
      source: 'test',
      name: 'failed.txt',
      data: new Blob(['failed']),
    })
    // Uploaded once before, so upload() leaves it out.
    uppy.setFileState(failed, {
      progress: { ...uppy.getFile(failed).progress, uploadStarted: 1 },
    })

    const upload = uppy.upload()
    await vi.waitFor(() =>
      expect(plugin.assembly?.status.assembly_id).toBe('A1'),
    )
    const running = plugin.assembly
    uppy.setFileState(failed, { error: 'earlier failure' })
    await uppy.retryUpload(failed)

    // Not added to the running upload's Assembly, which goes on.
    expect(plugin.client.createAssembly).toHaveBeenCalledTimes(2)
    expect(running.closed).toBe(false)
    expect(uppy.getState().allowNewUpload).toBe(false)
    // The live Assembly (the UI's) is the running one again, which reports
    // each status once.
    expect(plugin.assembly).toBe(running)
    const changed = vi.fn()
    uppy.on('restore:plugin-data-changed', changed)
    running.status = { ...running.status, ok: 'ASSEMBLY_EXECUTING' }
    expect(changed).toHaveBeenCalledOnce()
    expect(uppy.getState().plugins.Transloadit.assemblyStatus.ok).toBe(
      'ASSEMBLY_EXECUTING',
    )

    uploading.resolve()
    await upload
    expect(running.closed).toBe(true)
    expect(uppy.getState().allowNewUpload).toBe(true)
  })

  it("goes on when a file's upload URL arrives after a sibling's failure let go of the Assembly", async () => {
    serveAssemblies()
    const uppy = new Core()
    uppy.use(Transloadit, {
      importFromUploadURLs: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(async () => assemblyStatus('A1'))
    plugin.client.reserveFile = vi.fn(async () => {})
    plugin.client.addFile = vi.fn(async () => {})
    // The failure is reported to Transloadit; not under test here.
    plugin.client.submitError = vi.fn(async () => {})
    // One file fails, then the other is uploaded, as with XHRUpload.
    uppy.addUploader(async ([a, b]) => {
      uppy.emit('upload-error', uppy.getFile(a), new Error('upload failed'))
      uppy.emit('upload-success', uppy.getFile(b), {
        uploadURL: 'https://example.com/b',
      })
    })
    uppy.addFile({ source: 'test', name: 'a.txt', data: new Blob(['a']) })
    uppy.addFile({ source: 'test', name: 'b.txt', data: new Blob(['b']) })

    const result = await uppy.upload()

    expect(result.failed).toHaveLength(1)
    // Nothing to add it to: the Assembly cannot complete without its sibling.
    expect(plugin.client.addFile).not.toHaveBeenCalled()
  })

  it('fails the files instead of waiting forever when the final status of a finished Assembly cannot be fetched', async () => {
    network.use(
      http.get(
        'https://api2.transloadit.com/ws',
        () => new HttpResponse(null, { status: 204 }),
      ),
      // Finished from the first poll on: polling sees nothing new after that.
      http.get('https://api2.transloadit.com/assemblies/:id', ({ params }) =>
        HttpResponse.json({
          ...assemblyStatus(params.id),
          ok: 'ASSEMBLY_COMPLETED',
        }),
      ),
    )
    const uppy = new Core()
    uppy.use(Transloadit, {
      // The test's uploader instead of Transloadit's own Tus one.
      importFromUploadURLs: true,
      waitForEncoding: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(async () => assemblyStatus('A1'))
    plugin.client.reserveFile = vi.fn(async () => {})
    // The final status, requested once the Assembly is finished.
    plugin.client.getAssemblyStatus = vi.fn(async () => {
      throw new Error('status unavailable')
    })
    // The failure is reported to Transloadit; not under test here.
    plugin.client.submitError = vi.fn(async () => {})
    uppy.addUploader(async () => {})
    const encoding = vi.fn()
    uppy.on('postprocess-progress', encoding)
    const id = uppy.addFile({
      source: 'test',
      name: 'a.txt',
      data: new Blob(['a']),
    })
    const upload = uppy.upload()
    // Uploaded, and waiting for its Assembly.
    await vi.waitFor(() => expect(encoding).toHaveBeenCalled())
    await plugin.assembly.update()

    const result = await upload

    expect(result.failed).toHaveLength(1)
    expect(uppy.getFile(id).error).toBe('status unavailable')
    expect(plugin.assembly).toBeUndefined()
    expect(uppy.getState().allowNewUpload).toBe(true)
  })

  it('reports encoding progress on restored files', async () => {
    serveAssemblies()
    const uppy = new Core()
    uppy.use(Transloadit, {
      waitForEncoding: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    const tusUploadUrl = 'https://api2.transloadit.com/resumable/files/a'
    const id = uppy.addFile({
      source: 'test',
      name: 'a.txt',
      data: new Blob(['a']),
    })
    uppy.setFileState(id, { uploadURL: tusUploadUrl })
    const encoding = vi.fn()
    uppy.on('postprocess-progress', encoding)
    uppy.emit('restored', {
      Transloadit: {
        assemblyResponse: {
          ...assemblyStatus('R1'),
          uploads: [{ id: 'tl-a', tus_upload_url: tusUploadUrl }],
        },
      },
    })
    await plugin.restored

    plugin.assembly.emit('execution-progress', { progress_combined: 50 })

    // On the Uppy file, not on the Assembly's upload id.
    expect(encoding).toHaveBeenCalledOnce()
    expect(encoding.mock.lastCall.slice(0, 2)).toEqual([
      expect.objectContaining({ id }),
      expect.objectContaining({ value: 0.5 }),
    ])
    plugin.assembly.close()
  })

  it('restores an Assembly to the upload whose files are in it', async () => {
    serveAssemblies()
    const uppy = new Core()
    uppy.use(Transloadit, {
      waitForEncoding: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    uppy.addUploader(async () => {})
    const a = uppy.addFile({
      source: 'test',
      name: 'a.txt',
      data: new Blob(['a']),
    })
    const b = uppy.addFile({
      source: 'test',
      name: 'b.txt',
      data: new Blob(['b']),
    })
    // As Golden Retriever restores them: upload A started first, and retry B
    // has the Assembly that was saved (the live one). Both are past their
    // upload step (preprocessor, uploader, postprocessor).
    uppy.setFileState(b, { transloadit: { assembly: 'R1' } })
    uppy.setState({
      currentUploads: {
        A: { fileIDs: [a], step: 2, result: {} },
        B: { fileIDs: [b], step: 2, result: {} },
      },
    })
    uppy.emit('restored', {
      Transloadit: { assemblyResponse: assemblyStatus('R1') },
    })
    await plugin.restored
    const encoding = vi.fn()
    uppy.on('postprocess-progress', encoding)

    // A had no Assembly saved: nothing to wait for.
    await uppy.restore('A')
    expect(encoding).not.toHaveBeenCalled()
    // B waits for its encoding.
    const restoring = uppy.restore('B')
    await vi.waitFor(() =>
      expect(encoding.mock.calls.map(([file]) => file.id)).toEqual([b]),
    )
    uppy.emit('transloadit:complete', plugin.assembly.status)
    await restoring
  })

  it("reports an Assembly's own status with its uploads and results while another is live", async () => {
    serveAssemblies()
    const uppy = new Core()
    uppy.use(Transloadit, {
      // The test's uploader instead of Transloadit's own Tus one.
      importFromUploadURLs: true,
      waitForEncoding: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    let created = 0
    plugin.client.createAssembly = vi.fn(async () =>
      assemblyStatus(`A${++created}`),
    )
    plugin.client.reserveFile = vi.fn(async () => {})
    plugin.client.cancelAssembly = vi.fn(async () => {})
    // Both uploads stay in their upload step.
    uppy.addUploader(() => new Promise(() => {}))
    const newer = uppy.addFile({
      source: 'test',
      name: 'new.txt',
      data: new Blob(['new']),
    })
    uppy.setFileState(newer, { uploadURL: 'https://example.com/new' })
    const failed = uppy.addFile({
      source: 'test',
      name: 'failed.txt',
      data: new Blob(['failed']),
    })
    // Uploaded once before, so upload() leaves it out.
    uppy.setFileState(failed, {
      progress: { ...uppy.getFile(failed).progress, uploadStarted: 1 },
    })
    uppy.upload().catch(() => {})
    await vi.waitFor(() =>
      expect(plugin.assembly?.status.assembly_id).toBe('A1'),
    )
    const running = plugin.assembly
    uppy.setFileState(failed, { error: 'earlier failure' })
    uppy.retryUpload(failed).catch(() => {})
    // The retry's is the live one now.
    await vi.waitFor(() =>
      expect(plugin.assembly?.status.assembly_id).toBe('A2'),
    )
    const uploaded = vi.fn()
    const resulted = vi.fn()
    uppy.on('transloadit:upload', uploaded)
    uppy.on('transloadit:result', resulted)

    running.emit('upload', {
      id: 'tl-new',
      tus_upload_url: 'https://example.com/new',
    })
    running.emit('result', 'thumbs', { id: 'r1' })

    expect(uploaded.mock.lastCall[1].assembly_id).toBe('A1')
    expect(resulted.mock.lastCall[2].assembly_id).toBe('A1')
    uppy.cancelAll()
  })

  it.each([
    'fails',
    'is cancelled',
  ])('ends an upload whose import into the Assembly %s after its upload', async (outcome) => {
    serveAssemblies()
    const uppy = new Core()
    uppy.use(Transloadit, {
      // Not waiting for encoding: the upload is done once its files are in.
      importFromUploadURLs: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.createAssembly = vi.fn(async () => assemblyStatus('A1'))
    plugin.client.reserveFile = vi.fn(async () => {})
    plugin.client.cancelAssembly = vi.fn(async () => {})
    const importing = Promise.withResolvers()
    plugin.client.addFile = vi.fn(() => importing.promise)
    // The failure is reported to Transloadit; not under test here.
    plugin.client.submitError = vi.fn(async () => {})
    uppy.addUploader(async ([id]) => {
      uppy.emit('upload-success', uppy.getFile(id), {
        uploadURL: 'https://example.com/a',
      })
    })
    const id = uppy.addFile({
      source: 'test',
      name: 'a.txt',
      data: new Blob(['a']),
    })

    const upload = uppy.upload()
    await vi.waitFor(() => expect(plugin.client.addFile).toHaveBeenCalled())
    // The uploader is done; the file is not in the Assembly yet.
    await new Promise((resolve) => setTimeout(resolve))
    if (outcome === 'fails') {
      importing.reject(new Error('import failed'))
      const result = await upload
      expect(result.failed.map((file) => file.id)).toEqual([id])
    } else {
      // Its import never returns: the cancel still ends the upload.
      uppy.cancelAll()
      await upload
    }
  })

  it('stops listening once uninstalled', () => {
    const uppy = new Core()
    uppy.use(Transloadit, {
      importFromUploadURLs: true,
      assemblyOptions: { params: { auth: { key: 'k' }, template_id: 't' } },
    })
    const plugin = uppy.getPlugin('Transloadit')
    plugin.client.submitError = vi.fn(async () => {})
    uppy.removePlugin(plugin)

    uppy.emit('upload-error', undefined, new Error('tus: upload failed'))
    uppy.emit('restored', {
      Transloadit: { assemblyResponse: assemblyStatus('R1') },
    })

    expect(plugin.client.submitError).not.toHaveBeenCalled()
    expect(plugin.assembly).toBeUndefined()
  })
})
