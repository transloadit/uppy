import { S3Client } from '@aws-sdk/client-s3'
import express from 'express'
import request from 'supertest'
import { describe, expect, test, vi } from 'vitest'
import s3 from '../src/server/controllers/s3.js'

type Cmd = { constructor: { name: string }; input: Record<string, unknown> }

/**
 * The S3 router alone, on a real client (presigning is local) whose `send` is
 * replaced, so no request leaves the process.
 */
const makeApp = (
  send: (cmd: Cmd) => Promise<unknown> = vi.fn(),
  options: Partial<Parameters<typeof s3>[0]> = {},
) => {
  const client = new S3Client({
    region: 'us-east-1',
    credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
  })
  vi.spyOn(client, 'send').mockImplementation(send as never)
  const app = express()
  app.use((req, _res, next) => {
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
