import { createServer, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Readable } from 'node:stream'
import type { Request } from 'express'
import { afterEach, expect, onTestFinished, test, vi } from 'vitest'
import { defaultOptions } from '../dist/config/companion.js'
import Uploader, {
  PAUSED_TIMEOUT_MS,
  STALL_TIMEOUT_MS,
} from '../dist/server/Uploader.js'

// Against the real tus-js-client: a tus server that takes long to store a
// chunk is not a stalled upload.

afterEach(() => {
  vi.useRealTimers()
})

test('waiting for the tus server to answer a PATCH is not a stall', async () => {
  const tus = { 'Tus-Resumable': '1.0.0' }
  const patchReceived = Promise.withResolvers<ServerResponse>()
  const server = createServer((req, res) => {
    if (req.method === 'POST') {
      res.writeHead(201, { ...tus, Location: '/files/1' }).end()
      return
    }
    // read the whole chunk, then take a while to answer
    req.resume()
    req.on('end', () => patchReceived.resolve(res))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  onTestFinished(() => {
    server.closeAllConnections()
    server.close()
  })
  const endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}/files`

  // only the stall watcher's clock: tus-js-client and the sockets run for real
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
  const uploader = new Uploader({
    companionOptions: { ...defaultOptions, streamingUpload: true },
    endpoint,
    protocol: 'tus',
    size: 17,
    pathPrefix: '/tmp',
    metadata: { name: 'file.txt' },
  })
  onTestFinished(() => uploader.removeEmitterListeners())
  const settled = vi.fn()
  const upload = uploader.uploadStream(
    Readable.from([Buffer.from('Some file content')]),
    {} as Request,
  )
  upload.then(settled, settled)

  const res = await patchReceived.promise
  await vi.advanceTimersByTimeAsync(3 * STALL_TIMEOUT_MS)
  expect(settled).not.toHaveBeenCalled()

  res.writeHead(204, { ...tus, 'Upload-Offset': '17' }).end()
  await expect(upload).resolves.toEqual({ url: `${endpoint}/1` })
})

test('a tus server that never answers is not waited for forever', async () => {
  const tus = { 'Tus-Resumable': '1.0.0' }
  const patchReceived = Promise.withResolvers<void>()
  const server = createServer((req, res) => {
    if (req.method === 'POST') {
      res.writeHead(201, { ...tus, Location: '/files/1' }).end()
      return
    }
    // read the whole chunk, then never answer
    req.resume()
    req.on('end', () => patchReceived.resolve())
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  onTestFinished(() => {
    server.closeAllConnections()
    server.close()
  })
  const endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}/files`

  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
  const uploader = new Uploader({
    companionOptions: { ...defaultOptions, streamingUpload: true },
    endpoint,
    protocol: 'tus',
    size: 17,
    pathPrefix: '/tmp',
    metadata: { name: 'file.txt' },
  })
  onTestFinished(() => uploader.removeEmitterListeners())
  const upload = uploader.uploadStream(
    Readable.from([Buffer.from('Some file content')]),
    {} as Request,
  )
  upload.catch(() => {})

  await patchReceived.promise
  await vi.advanceTimersByTimeAsync(PAUSED_TIMEOUT_MS + 2 * STALL_TIMEOUT_MS)
  await expect(upload).rejects.toThrow('Upload stalled')
})
