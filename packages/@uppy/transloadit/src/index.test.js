import { createServer } from 'node:http'
import { once } from 'node:events'
import { describe, expect, it } from 'vitest'
import Core from '@uppy/core'
import Transloadit from './index.ts'
import 'whatwg-fetch'

describe('Transloadit', () => {
  it('Throws errors if options are missing', () => {
    const uppy = new Core()

    expect(() => {
      uppy.use(Transloadit, { params: {} })
    }).toThrowError(/The `params\.auth\.key` option is required/)
  })

  it('Accepts a JSON string as `params` for signature authentication', () => {
    const uppy = new Core()

    expect(() => {
      uppy.use(Transloadit, {
        params: 'not json',
      })
    }).toThrowError(/The `params` option is a malformed JSON string/)

    expect(() => {
      uppy.use(Transloadit, {
        params: '{"template_id":"some template id string"}',
      })
    }).toThrowError(/The `params\.auth\.key` option is required/)
    expect(() => {
      uppy.use(Transloadit, {
        params:
          '{"auth":{"key":"some auth key string"},"template_id":"some template id string"}',
      })
    }).not.toThrowError(/The `params\.auth\.key` option is required/)
  })

  it('Does not leave lingering progress if getAssemblyOptions fails', () => {
    const error = new Error('expected failure')
    const uppy = new Core()
    uppy.use(Transloadit, {
      getAssemblyOptions() {
        return Promise.reject(error)
      },
    })

    uppy.addFile({
      source: 'jest',
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
      params: {
        auth: { key: 'some auth key string' },
        template_id: 'some template id string',
      },
    })

    uppy.getPlugin('Transloadit').client.createAssembly = () =>
      Promise.reject(new Error('VIDEO_ENCODE_VALIDATION'))

    uppy.addFile({
      source: 'jest',
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

  // For some reason this test doesn't pass on CI
  it.skip('Can start an assembly with no files and no fields', async () => {
    const server = createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', '*')
      res.setHeader('Content-Type', 'application/json')
      res.end('{"websocket_url":"about:blank"}')
    }).listen()
    await once(server, 'listening')
    const uppy = new Core({
      autoProceed: false,
    })
    uppy.use(Transloadit, {
      service: `http://localhost:${server.address().port}`,
      alwaysRunAssembly: true,
      params: {
        auth: { key: 'some auth key string' },
        template_id: 'some template id string',
      },
    })

    await uppy.upload()
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })

  // For some reason this test doesn't pass on CI
  it.skip('Can start an assembly with no files and some fields', async () => {
    const server = createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', '*')
      res.setHeader('Content-Type', 'application/json')
      res.end('{"websocket_url":"about:blank"}')
    }).listen()
    await once(server, 'listening')
    const uppy = new Core({
      autoProceed: false,
    })
    uppy.use(Transloadit, {
      service: `http://localhost:${server.address().port}`,
      alwaysRunAssembly: true,
      params: {
        auth: { key: 'some auth key string' },
        template_id: 'some template id string',
      },
      fields: ['hasOwnProperty'],
    })

    await uppy.upload()
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })
})
