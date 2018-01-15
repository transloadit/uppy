#!/usr/bin/env node

// Set up environment variables, see
// https://uppy.io/docs/server/
Object.assign(process.env, {
  UPPYSERVER_SECRET: 'development',
  UPPYSERVER_DATADIR: './output',
  UPPYSERVER_DOMAIN: 'localhost:3020',
  UPPYSERVER_PROTOCOL: 'http',
  UPPYSERVER_PORT: '3020',
  UPPY_ENDPOINT: 'localhost:3452',
  UPPY_ENDPOINTS: 'localhost:3452'
})

require('uppy-server/lib/standalone/start-server')
