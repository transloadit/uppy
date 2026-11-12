import { once } from 'node:events'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { PassThrough } from 'node:stream'
import { setTimeout as sleep } from 'node:timers/promises'
import { Upload } from 'tus-js-client'
import { expect, onTestFinished, test } from 'vitest'

// Uploader's stall watcher counts bytes waiting in the source stream as
// progress. That holds only while tus-js-client reads a chunk with
// read(chunkSize), leaving the bytes in the source until the chunk is whole.
test('tus-js-client leaves a partial chunk in the source stream', async () => {
  const server = createServer((req, res) => {
    if (req.method === 'POST') {
      res.writeHead(201, { Location: '/files/1', 'Tus-Resumable': '1.0.0' })
    }
    res.end()
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  onTestFinished(() => {
    server.closeAllConnections()
    server.close()
  })
  const { port } = server.address() as AddressInfo

  const source = new PassThrough()
  const upload = new Upload(source, {
    endpoint: `http://127.0.0.1:${port}/files`,
    uploadSize: 1_000_000,
    chunkSize: 50e6,
    retryDelays: [],
  })
  upload.start()
  onTestFinished(() => upload.abort())

  source.write(Buffer.alloc(10_000))
  await sleep(100)
  // Node raises the mark to what read() asked for: tus is reading a whole chunk.
  expect(source.readableHighWaterMark).toBeGreaterThanOrEqual(1_000_000)
  expect(source.readableLength).toBe(10_000)
  source.write(Buffer.alloc(10_000))
  await sleep(100)
  expect(source.readableLength).toBe(20_000)
})
