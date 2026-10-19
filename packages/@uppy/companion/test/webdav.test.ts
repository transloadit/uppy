import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { FORBIDDEN_IP_ADDRESS } from '../dist/server/helpers/request.js'
import WebdavProvider from '../dist/server/provider/webdav/index.js'

let server: http.Server
let requestCount = 0
let webdavUrl: string

beforeAll(async () => {
  server = http.createServer((_req, res) => {
    requestCount++
    res.writeHead(207, { 'content-type': 'application/xml' })
    res.end(
      '<?xml version="1.0"?><d:multistatus xmlns:d="DAV:"></d:multistatus>',
    )
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  webdavUrl = `http://127.0.0.1:${port}/`
})

afterAll(() => {
  server.close()
})

// WebDAV doesn't read the companion context
const simpleAuth = (allowLocalUrls: boolean) =>
  new WebdavProvider({ allowLocalUrls }).simpleAuth({
    requestBody: { form: { webdavUrl } },
    companion: {} as never,
  })

describe('webdav SSRF protection', () => {
  beforeEach(() => {
    requestCount = 0
  })

  test('blocks local IPs when allowLocalUrls is false', async () => {
    await expect(simpleAuth(false)).rejects.toThrow(FORBIDDEN_IP_ADDRESS)
    expect(requestCount).toBe(0)
  })

  test('allows local IPs when allowLocalUrls is true', async () => {
    await expect(simpleAuth(true)).resolves.toEqual({ webdavUrl })
    expect(requestCount).toBe(1)
  })
})
