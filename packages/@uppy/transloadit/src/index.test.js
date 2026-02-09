import Core from '@uppy/core'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { describe, expect, it, vi } from 'vitest'
import Transloadit from './index.ts'
import 'whatwg-fetch'

vi.mock('@uppy/tus', async () => {
  const { BasePlugin } = await import('@uppy/core')

  class Tus extends BasePlugin {
    static VERSION = '0.0.0-test'

    constructor(uppy, opts) {
      super(uppy, opts)
      this.type = 'uploader'
      this.id = this.opts.id || 'Tus'
      this.#handleUpload = this.#handleUpload.bind(this)
    }

    #handleUpload = async (fileIDs) => {
      const files = this.uppy.getFilesByIds(fileIDs)
      this.uppy.emit('upload-start', files)

      await new Promise((resolve) => setTimeout(resolve, 150))

      files.forEach((file) => {
        this.uppy.emit('upload-success', this.uppy.getFile(file.id), {
          uploadURL: `https://localhost/resumable/files/${file.id}`,
          status: 200,
          body: {},
        })
      })
    }

    install() {
      this.uppy.setState({
        capabilities: {
          ...this.uppy.getState().capabilities,
          resumableUploads: true,
        },
      })
      this.uppy.addUploader(this.#handleUpload)
    }

    uninstall() {
      this.uppy.setState({
        capabilities: {
          ...this.uppy.getState().capabilities,
          resumableUploads: false,
        },
      })
      this.uppy.removeUploader(this.#handleUpload)
    }
  }

  return { default: Tus }
})

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

    const server = setupServer(
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
      data: Buffer.from('test file content'),
    })
    uppy.addFile({
      source: 'test',
      name: 'traffic.jpg',
      data: Buffer.from('test file content 2'),
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
