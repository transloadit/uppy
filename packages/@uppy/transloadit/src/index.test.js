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
    let firstUploadCallCount = 0

    const server = setupServer(
      http.post('*/assemblies', ({ request }) => {
        return HttpResponse.json({
          assembly_id: 'test-assembly-id',
          websocket_url: 'ws://localhost:8080',
          tus_url: 'https://localhost/resumable/files/',
          assembly_ssl_url: 'https://localhost/assemblies/test-assembly-id',
          ok: 'ASSEMBLY_EXECUTING',
        })
      }),
      http.get('*/assemblies/*', () => {
        return HttpResponse.json({
          assembly_id: 'test-assembly-id',
          ok: 'ASSEMBLY_COMPLETED',
          results: {},
        })
      }),
      http.post('*/resumable/files/', () => {
        firstUploadCallCount++
        return HttpResponse.json({
          tus_enabled: true,
          resumable_file_id: `test-file-id-${firstUploadCallCount}`,
        })
      }),
      http.patch('*/resumable/files/*', () => {
        return HttpResponse.json({
          ok: 'RESUMABLE_FILE_UPLOADED',
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

    uppy.upload()
    await new Promise((resolve) => setTimeout(resolve, 100))
    uppy.pauseAll()
    await uppy.upload()

    expect(successSpy).toHaveBeenCalled()

    server.close()
  })
})
