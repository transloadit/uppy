import http from 'node:http'
import net, { type AddressInfo } from 'node:net'
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import express from 'express'
import request from 'supertest'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import s3 from '../src/server/controllers/s3.js'

type Cmd = { constructor: { name: string }; input: Record<string, unknown> }
type SendOptions = { abortSignal?: AbortSignal } | undefined

const requestStarted = vi.fn()
const responseClosed = vi.fn()
const routeErrors = vi.fn()

/**
 * The S3 router alone, on a real client (presigning is local) whose `send` is
 * replaced, so no request leaves the process.
 */
const makeApp = (
  send: (cmd: Cmd, options: SendOptions) => Promise<unknown> = vi.fn(),
  options: Partial<Parameters<typeof s3>[0]> = {},
) => {
  const client = new S3Client({
    region: 'us-east-1',
    credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
  })
  vi.spyOn(client, 'send').mockImplementation(send as never)
  const app = express()
  app.use((req, res, next) => {
    requestStarted(req.originalUrl, req.socket)
    res.on('close', () => responseClosed(req.originalUrl))
    req.companion = {
      options: {},
      s3Client: client,
      s3ProviderClients: new Map(),
    } as never
    next()
  })
  app.use(
    '/s3',
    s3({
      bucket: 'test-bucket',
      getKey: ({ filename }) => filename,
      expires: 800,
      conditions: [],
      ...options,
    }),
  )
  app.use(
    (
      err: unknown,
      _req: express.Request,
      _res: express.Response,
      next: express.NextFunction,
    ) => {
      routeErrors(err)
      next(err)
    },
  )
  return app
}

describe('batchSignPartsUpload', () => {
  const batch = (partNumbers: string) =>
    request(makeApp())
      .get('/s3/multipart/upload-1/batch')
      .query({ key: 'a.jpg', partNumbers })

  test('signs up to 100 part numbers', async () => {
    const partNumbers = Array.from({ length: 100 }, (_, i) => i + 1)
    const res = await batch(partNumbers.join(',')).expect(200)
    expect(Object.keys(res.body.presignedUrls)).toHaveLength(100)
  })

  test('refuses more than 100 part numbers before signing', async () => {
    const res = await batch(Array(101).fill('1').join(',')).expect(400)
    expect(res.body.error).toBe(
      's3: at most 100 part numbers can be signed per request.',
    )
  })

  test.each([
    '0',
    '10001',
    '1.5',
    '1abc',
    '-1',
    '1,,2',
  ])('refuses part number list %j', async (partNumbers) => {
    const res = await batch(partNumbers).expect(400)
    expect(res.body.error).toBe(
      's3: the part numbers must be a number between 1 and 10000.',
    )
  })
})

/**
 * ListParts for uploads with ids ending in `-<pages>`, one part per page. With
 * `hold`, pages from `holdFrom` on wait until `release(uploadId)`, or reject
 * once the call is aborted.
 */
const fakeListParts = ({ hold = false, holdFrom = 2 } = {}) => {
  const held = new Map<string, () => void>()
  const send = vi.fn(async (cmd: Cmd, options?: SendOptions) => {
    const uploadId = String(cmd.input['UploadId'])
    const marker = cmd.input['PartNumberMarker']
    const page = marker == null ? 1 : Number(marker) + 1
    if (hold && page >= holdFrom) {
      await new Promise<void>((resolve, reject) => {
        held.set(uploadId, resolve)
        options?.abortSignal?.addEventListener('abort', () =>
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
        )
      })
    }
    return {
      Parts: [{ PartNumber: page, ETag: `"etag-${page}"`, Size: 5 }],
      IsTruncated: page < Number(uploadId.split('-').at(-1)),
      NextPartNumberMarker: String(page),
    }
  })
  /** How many ListParts pages were asked for, for one upload. */
  const pagesAsked = (uploadId: string) =>
    send.mock.calls.filter(([cmd]) => cmd.input['UploadId'] === uploadId).length
  const release = (uploadId: string) => {
    held.get(uploadId)?.()
    held.delete(uploadId)
  }
  return { send, held, pagesAsked, release }
}

const listenOn = (app: express.Express) => {
  const server = app.listen(0)
  onTestFinished(() => {
    server.closeAllConnections()
    server.close()
  })
  return (server.address() as AddressInfo).port
}

/** Each request on its own connection, so aborting one closes its socket. */
const listen = (app: express.Express) => {
  const port = listenOn(app)
  return (uploadId: string) => {
    const path = `/s3/multipart/${uploadId}?key=a.jpg`
    const req = http.get({ port, path, agent: false })
    const response = new Promise<{ status: number | undefined; body: unknown }>(
      (resolve, reject) => {
        req.on('error', reject)
        req.on('response', (res) => {
          let data = ''
          res.setEncoding('utf8')
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () =>
            resolve({ status: res.statusCode, body: JSON.parse(data) }),
          )
        })
      },
    )
    const abort = async () => {
      response.catch(() => {})
      req.destroy()
      await vi.waitFor(() => expect(responseClosed).toHaveBeenCalledWith(path))
    }
    return { response, abort }
  }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 20))

const partsUpTo = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    PartNumber: i + 1,
    ETag: `"etag-${i + 1}"`,
    Size: 5,
  }))

describe('getUploadedParts', () => {
  test('returns the parts from every page', async () => {
    const { send } = fakeListParts()
    const res = await request(makeApp(send))
      .get('/s3/multipart/upload-3')
      .query({ key: 'a.jpg' })
      .expect(200)
    expect(res.body).toEqual(partsUpTo(3))
    expect(send.mock.calls.map(([cmd]) => cmd.input)).toEqual(
      [undefined, '1', '2'].map((PartNumberMarker) => ({
        Bucket: 'test-bucket',
        Key: 'a.jpg',
        UploadId: 'upload-3',
        PartNumberMarker,
      })),
    )
  })

  test('stops listing once the client has gone', async () => {
    const { send, held, pagesAsked, release } = fakeListParts({ hold: true })
    const get = listen(makeApp(send))
    const { abort } = get('gone-10')
    await vi.waitFor(() => expect(held.has('gone-10')).toBe(true))
    await abort()
    release('gone-10')
    await tick()
    expect(pagesAsked('gone-10')).toBe(2)
  })

  test('runs at most 4 multi-page listings at once, without holding up one-page ones', async () => {
    const { send, held, pagesAsked, release } = fakeListParts({ hold: true })
    const get = listen(makeApp(send))
    const ids = ['a-2', 'b-2', 'c-2', 'd-2', 'e-2', 'f-2']
    const requests = new Map(ids.map((id) => [id, get(id)]))
    await vi.waitFor(() => expect(held.size).toBe(4))
    await tick()
    expect(held.size).toBe(4)
    const waiting = ids.filter((id) => pagesAsked(id) === 1)
    expect(waiting).toHaveLength(2)

    // a one-page listing doesn't queue behind the multi-page ones
    expect(await get('small-1').response).toEqual({
      status: 200,
      body: partsUpTo(1),
    })

    // a waiting request whose client has gone drops out of the queue
    const [gone, next] = waiting as [string, string]
    await requests.get(gone)?.abort()
    const [first] = held.keys()
    release(first as string)
    await vi.waitFor(() => expect(pagesAsked(next)).toBe(2))
    for (const id of held.keys()) release(id)

    for (const id of ids.filter((id) => id !== gone)) {
      expect(await requests.get(id)?.response).toEqual({
        status: 200,
        body: partsUpTo(2),
      })
    }
    expect(pagesAsked(gone)).toBe(1)
  })

  test('cancels the ListParts call in flight once the client has gone', async () => {
    routeErrors.mockClear()
    const { send, held } = fakeListParts({ hold: true, holdFrom: 1 })
    const get = listen(makeApp(send))
    const { abort } = get('cancel-1')
    await vi.waitFor(() => expect(held.has('cancel-1')).toBe(true))
    await abort()
    expect(send.mock.calls[0]?.[1]?.abortSignal?.aborted).toBe(true)
    await tick()
    expect(routeErrors).not.toHaveBeenCalled()
  })

  test('frees the slots of listings cancelled while paging', async () => {
    routeErrors.mockClear()
    const { send, held, release } = fakeListParts({ hold: true })
    const get = listen(makeApp(send))
    for (const id of ['w-3', 'x-3', 'y-3', 'z-3']) {
      const { abort } = get(id)
      await vi.waitFor(() => expect(held.has(id)).toBe(true))
      await abort()
    }
    const { response } = get('after-2')
    await vi.waitFor(() => expect(held.has('after-2')).toBe(true))
    release('after-2')
    expect(await response).toEqual({ status: 200, body: partsUpTo(2) })
    expect(routeErrors).not.toHaveBeenCalled()
  })

  const pipelined = (port: number, uploadIds: string[]) => {
    const socket = net.connect(port, '127.0.0.1')
    onTestFinished(() => {
      socket.destroy()
    })
    socket.write(
      uploadIds
        .map(
          (id) => `GET /s3/multipart/${id}?key=a HTTP/1.1\r\nHost: x\r\n\r\n`,
        )
        .join(''),
    )
    return socket
  }

  test('answers pipelined listings in order', async () => {
    const { send } = fakeListParts()
    const socket = pipelined(listenOn(makeApp(send)), ['a-1', 'b-3', 'c-2'])
    let data = ''
    socket.setEncoding('utf8')
    socket.on('data', (chunk) => {
      data += chunk
    })
    await vi.waitFor(() =>
      expect(data.match(/HTTP\/1\.1 200/g)).toHaveLength(3),
    )
    await vi.waitFor(() => {
      const bodies = data
        .split('HTTP/1.1 ')
        .slice(1)
        .map((answer) => JSON.parse(answer.slice(answer.indexOf('\r\n\r\n'))))
      expect(bodies).toEqual([partsUpTo(1), partsUpTo(3), partsUpTo(2)])
    })
  })

  test('lists for a connection that does not read only once its last answer is out', async () => {
    // an answer of about 16 MB, more than the socket buffers take
    const send = vi.fn(async () => ({
      Parts: Array.from({ length: 1000 }, (_, i) => ({
        PartNumber: i + 1,
        ETag: 'e'.repeat(16_000),
        Size: 5,
      })),
      IsTruncated: false,
    }))
    const port = listenOn(makeApp(send))
    const socket = pipelined(port, Array(5).fill('big-1'))
    socket.pause()
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1))
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(send).toHaveBeenCalledTimes(1)

    socket.destroy()
    // Wait for the server side of the connection to close. Its queued
    // responses close on Node 26 but not on Node 22, so don't count those.
    const serverSocket = requestStarted.mock.calls.at(-1)?.[1] as net.Socket
    await vi.waitFor(() => expect(serverSocket.destroyed).toBe(true))
    await tick()
    expect(send).toHaveBeenCalledTimes(1)
  })
})

/** S3 for the multipart routes; uploads are as in `fakeListParts`. */
const fakeS3 = () => {
  const { send: listParts } = fakeListParts()
  const send = vi.fn(async (cmd: Cmd) => {
    if (cmd instanceof ListPartsCommand) return await listParts(cmd)
    if (cmd instanceof CreateMultipartUploadCommand) {
      return { Key: cmd.input['Key'], UploadId: 'upload-1', Bucket: 'b' }
    }
    if (cmd instanceof CompleteMultipartUploadCommand) {
      return { Location: 'https://b/a.jpg', Key: 'a.jpg', Bucket: 'b' }
    }
    return {}
  })
  const sent = (type: unknown) =>
    send.mock.calls.filter(([cmd]) => cmd instanceof (type as never)).length
  return { send, sent }
}

describe('s3.conditions on multipart uploads', () => {
  test.each([
    [['content-length-range', 0, undefined]],
    [['content-length-range', 0, '10MB']],
    [['content-length-range', 0, null]],
    [['content-length-range', 10, 5]],
    [['content-length-range', -1, 5]],
  ])('refuses %j when the router is built', (condition) => {
    expect(() =>
      makeApp(undefined, { conditions: [condition] as never }),
    ).toThrow('content-length-range')
  })

  test('accepts a content-length-range given as numeric strings', () => {
    expect(() =>
      makeApp(undefined, {
        conditions: [['content-length-range', '0', '1000']] as never,
      }),
    ).not.toThrow()
  })

  const create = (conditions: unknown[], type: string) => {
    const { send, sent } = fakeS3()
    const app = makeApp(send, { conditions: conditions as never })
    return {
      sent,
      response: request(app)
        .post('/s3/multipart')
        .send({ filename: 'a.jpg', type, metadata: {} }),
    }
  }

  test.each([
    [['starts-with', '$Content-Type', 'image/'], 'image/png', 200],
    [['starts-with', '$Content-Type', 'image/'], 'image/png, image/gif', 200],
    [['starts-with', '$Content-Type', 'image/'], 'text/html', 400],
    [['starts-with', '$Content-Type', 'image/'], 'image/png,text/html', 400],
    [['starts-with', '$Content-Type', ''], 'text/html', 200],
    [['eq', '$content-type', 'image/png'], 'image/png', 200],
    [['eq', '$content-type', 'image/png'], 'image/pngx', 400],
    [{ 'Content-Type': 'image/png' }, 'image/png', 200],
    [{ 'content-type': 'image/png' }, 'text/html', 400],
    [['starts-with', '$key', 'uploads/'], 'text/html', 200],
    [['content-length-range', 0, 1], 'text/html', 200],
  ])('creating with %j and type %j answers %d', async (condition, type, status) => {
    const { response, sent } = create([condition], type)
    const res = await response.expect(status)
    if (status === 400) {
      expect(res.body.error).toBe('s3: this content type is not allowed')
    }
    expect(sent(CreateMultipartUploadCommand)).toBe(status === 200 ? 1 : 0)
  })

  const complete = (
    conditions: unknown[],
    uploadId: string,
    parts: { PartNumber: number; ETag: string }[],
  ) => {
    const { send, sent } = fakeS3()
    const app = makeApp(send, { conditions: conditions as never })
    return {
      sent,
      response: request(app)
        .post(`/s3/multipart/${uploadId}/complete`)
        .query({ key: 'a.jpg' })
        .send({ parts }),
    }
  }
  // as @uppy/aws-s3 sends them, without quotes
  const clientParts = (n: number) =>
    partsUpTo(n).map(({ PartNumber, ETag }) => ({
      PartNumber,
      ETag: ETag.replaceAll('"', ''),
    }))
  const range = ['content-length-range', 1, 10]

  test('completes an upload within content-length-range', async () => {
    const { response, sent } = complete([range], 'upload-2', clientParts(2))
    await response.expect(200)
    expect(sent(CompleteMultipartUploadCommand)).toBe(1)
  })

  test('counts only the parts being combined', async () => {
    const { response, sent } = complete([range], 'upload-3', clientParts(2))
    await response.expect(200)
    expect(sent(CompleteMultipartUploadCommand)).toBe(1)
  })

  test('aborts an upload larger than content-length-range', async () => {
    const { response, sent } = complete([range], 'upload-3', clientParts(3))
    const res = await response.expect(400)
    expect(res.body.error).toBe(
      's3: the file size is outside the allowed range',
    )
    expect(sent(AbortMultipartUploadCommand)).toBe(1)
    expect(sent(CompleteMultipartUploadCommand)).toBe(0)
  })

  test.each([
    ['an unknown ETag', [{ PartNumber: 1, ETag: 'other' }]],
    ['a missing part', clientParts(3)],
    ['a repeated part', [...clientParts(1), ...clientParts(1)]],
  ])('refuses %s without completing', async (_, parts) => {
    const { response, sent } = complete([range], 'upload-2', parts)
    const res = await response.expect(400)
    expect(res.body.error).toBe('s3: `parts` do not match the uploaded parts.')
    expect(sent(AbortMultipartUploadCommand)).toBe(0)
    expect(sent(CompleteMultipartUploadCommand)).toBe(0)
  })

  test('lists no parts without content-length-range', async () => {
    const { response, sent } = complete(
      [['starts-with', '$Content-Type', 'image/']],
      'upload-30',
      clientParts(30),
    )
    await response.expect(200)
    expect(sent(ListPartsCommand)).toBe(0)
    expect(sent(CompleteMultipartUploadCommand)).toBe(1)
  })
})
