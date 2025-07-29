#!/usr/bin/env node

import http from 'node:http'
import process from 'node:process'
import { execaNode } from 'execa'
import httpProxy from 'http-proxy'

const numInstances = 3
const lbPort = 3020
const companionStartPort = 3021

// simple load balancer that will direct requests round robin between companion instances
function createLoadBalancer(baseUrls) {
  const proxy = httpProxy.createProxyServer({ ws: true })

  let i = 0

  function getTarget() {
    return baseUrls[i % baseUrls.length]
  }

  const server = http.createServer((req, res) => {
    const target = getTarget()
    // console.log('req', req.method, target, req.url)
    proxy.web(req, res, { target }, (err) => {
      console.error('Load balancer failed to proxy request', err.message)
      res.statusCode = 500
      res.end()
    })
    i++
  })

  server.on('upgrade', (req, socket, head) => {
    const target = getTarget()
    // console.log('upgrade', target, req.url)
    proxy.ws(req, socket, head, { target }, (err) => {
      console.error('Load balancer failed to proxy websocket', err.message)
      console.error(err)
      socket.destroy()
    })
    i++
  })

  server.listen(lbPort)
  console.log('Load balancer listening', lbPort)
  return server
}

const isWindows = process.platform === 'win32'
const isOSX = process.platform === 'darwin'

const startCompanion = ({ name, port }) =>
  execaNode('packages/@uppy/companion/src/standalone/start-server.js', {
    nodeOptions: [
      '-r',
      'dotenv/config',
      // Watch mode support is limited to Windows and macOS at the time of writing.
      ...(isWindows || isOSX
        ? ['--watch-path', 'packages/@uppy/companion/src', '--watch']
        : []),
    ],
    cwd: new URL('../../../../', import.meta.url),
    stdio: 'inherit',
    env: {
      // Note: these env variables will override anything set in .env
      ...process.env,
      COMPANION_PORT: port,
      COMPANION_SECRET: 'development', // multi instance will not work without secret set
      COMPANION_PREAUTH_SECRET: 'development', // multi instance will not work without secret set
      COMPANION_ALLOW_LOCAL_URLS: 'true',
      COMPANION_ENABLE_URL_ENDPOINT: 'true',
      COMPANION_LOGGER_PROCESS_NAME: name,
      COMPANION_CLIENT_ORIGINS: 'true',
      COMPANION_DATADIR: '/tmp',
      COMPANION_DOMAIN: 'localhost:3020',
    },
  })

const hosts = Array.from({ length: numInstances }, (_, index) => {
  const port = companionStartPort + index
  return { index, port }
})

console.log(
  'Starting companion instances on ports',
  hosts.map(({ port }) => port),
)

const companions = hosts.map(({ index, port }) =>
  startCompanion({ name: `companion${index}`, port }),
)

let loadBalancer
try {
  loadBalancer = createLoadBalancer(
    hosts.map(({ port }) => `http://localhost:${port}`),
  )
  await Promise.all(companions)
} finally {
  loadBalancer?.close()
  companions.forEach((companion) => companion.kill())
}
