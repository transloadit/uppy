import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import type { Request } from 'express'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { defaultOptions } from '../dist/config/companion.js'
import Emitter from '../dist/server/emitter/index.js'
import Uploader from '../dist/server/Uploader.js'

// Pause, resume and cancel against the real tus-js-client, with
// streamingUpload off (tus reads the temp file).

let dir: string
let close: () => void
let requests: string[]
let endpoint: string
let holdPatch: PromiseWithResolvers<void> | undefined
let location: string

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'companion-tus-pause-'))
  requests = []
  location = '/files/1'
  let deleted = false
  const server = createServer((req, res) => {
    requests.push(req.method ?? '')
    req.on('error', () => {})
    const tus = { 'Tus-Resumable': '1.0.0' }
    if (req.method === 'POST') {
      res.writeHead(201, { ...tus, Location: location }).end()
    } else if (req.method === 'HEAD') {
      if (deleted) res.writeHead(404, tus).end()
      else
        res
          .writeHead(200, {
            ...tus,
            'Upload-Offset': '0',
            'Upload-Length': '17',
          })
          .end()
    } else if (req.method === 'PATCH') {
      req.resume()
      if (holdPatch) {
        // Leave the first PATCH hanging, so the upload can be paused mid-way.
        holdPatch.resolve()
        holdPatch = undefined
        return
      }
      req.on('end', () =>
        res.writeHead(204, { ...tus, 'Upload-Offset': '17' }).end(),
      )
    } else if (req.method === 'DELETE') {
      deleted = true
      res.writeHead(204, tus).end()
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}/files`
  close = () => {
    server.closeAllConnections()
    server.close()
  }
})

afterEach(() => {
  close()
  rmSync(dir, { recursive: true, force: true })
})

async function startPausedMidTransfer() {
  holdPatch = Promise.withResolvers<void>()
  const patching = holdPatch.promise
  const uploader = new Uploader({
    companionOptions: { ...defaultOptions, streamingUpload: false },
    endpoint,
    protocol: 'tus',
    size: 17,
    pathPrefix: dir,
    metadata: { name: 'file.txt' },
  })
  const upload = uploader.uploadStream(
    Readable.from([Buffer.from('Some file content')]),
    {} as Request,
  )
  upload.catch(() => {})
  await patching
  Emitter().emit(`pause:${uploader.token}`)
  // Let the aborted PATCH fail while tus-js-client is still aborted. Resumed
  // sooner, it can retry that PATCH next to the resumed upload.
  await new Promise((resolve) => setTimeout(resolve, 100))
  return { uploader, upload }
}

test('a paused tus upload resumes', async () => {
  const { uploader, upload } = await startPausedMidTransfer()
  Emitter().emit(`resume:${uploader.token}`)
  await expect(upload).resolves.toEqual({ url: `${endpoint}/1` })
  expect(requests).toEqual(['POST', 'PATCH', 'HEAD', 'PATCH'])
  uploader.removeEmitterListeners()
})

test('a cancel that races a resume sends nothing after the DELETE', async () => {
  const { uploader, upload } = await startPausedMidTransfer()
  // In one go, as when both arrive in the same WebSocket packet: the resumed
  // start() is still statting the temp file when the cancel lands.
  Emitter().emit(`resume:${uploader.token}`)
  Emitter().emit(`cancel:${uploader.token}`)
  await expect(upload).rejects.toThrow('Canceled')
  await new Promise((resolve) => setTimeout(resolve, 300))
  expect(requests).toEqual(['POST', 'PATCH', 'DELETE'])
  uploader.removeEmitterListeners()
})

test('a request refused for its upload URL is not retried', async () => {
  // the server sends the upload to a host uploadUrls doesn't allow
  location = endpoint.replace('127.0.0.1', 'localhost')
  const uploader = new Uploader({
    companionOptions: {
      ...defaultOptions,
      streamingUpload: false,
      uploadUrls: [new RegExp(`^${endpoint.replaceAll('.', '\\.')}`)],
    },
    endpoint,
    protocol: 'tus',
    size: 17,
    pathPrefix: dir,
    metadata: { name: 'file.txt' },
  })
  const started = Date.now()
  await expect(
    uploader.uploadStream(
      Readable.from([Buffer.from('Some file content')]),
      {} as Request,
    ),
  ).rejects.toThrow('upload URL does not match any allowed destinations')
  // tus-js-client would retry after 0, 1, 3 and 5 seconds
  expect(Date.now() - started).toBeLessThan(900)
  expect(requests).toEqual(['POST'])
  uploader.removeEmitterListeners()
})
