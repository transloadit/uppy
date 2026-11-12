import fs from 'node:fs'
import path from 'node:path'
import * as companion from '@uppy/companion'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import { createServer } from 'vite'

process.loadEnvFile(path.resolve(import.meta.dirname, '..', '..', '..', '.env'))

const app = express()

/**
 * Environment variables:
 *
 *   - COMPANION_AWS_REGION - Your space region, eg "ams3"
 *   - COMPANION_AWS_KEY - Your access key ID
 *   - COMPANION_AWS_SECRET - Your secret access key
 *   - COMPANION_AWS_BUCKET - Your space's name.
 *   - COMPANION_AWS_FORCE_PATH_STYLE - Indicates if s3ForcePathStyle should be used rather than subdomain for S3 buckets.
 */

if (!process.env.COMPANION_AWS_REGION)
  throw new Error(
    'Missing Space region, please set the COMPANION_AWS_REGION environment variable (eg. "COMPANION_AWS_REGION=ams3")',
  )
if (!process.env.COMPANION_AWS_KEY)
  throw new Error(
    'Missing access key, please set the COMPANION_AWS_KEY environment variable',
  )
if (!process.env.COMPANION_AWS_SECRET)
  throw new Error(
    'Missing secret key, please set the COMPANION_AWS_SECRET environment variable',
  )
if (!process.env.COMPANION_AWS_BUCKET)
  throw new Error(
    'Missing Space name, please set the COMPANION_AWS_BUCKET environment variable',
  )

// Prepare the server.
const PORT = process.env.PORT || 3452
const host = `localhost:${PORT}`

const DATA_DIR = path.join(import.meta.dirname, 'tmp')

fs.mkdirSync(DATA_DIR, { recursive: true })

// Set up the /params endpoint that will create signed URLs for us.
app.use(cors())
app.use(bodyParser.json())

const { app: companionApp } = companion.app({
  s3: {
    // This is the crucial part; set an endpoint template for the service you want to use.
    endpoint: 'https://{region}.digitaloceanspaces.com',
    getKey: ({ filename }) => `${crypto.randomUUID()}-${filename}`,

    key: process.env.COMPANION_AWS_KEY,
    secret: process.env.COMPANION_AWS_SECRET,
    bucket: process.env.COMPANION_AWS_BUCKET,
    region: process.env.COMPANION_AWS_REGION,
    forcePathStyle: process.env.COMPANION_AWS_FORCE_PATH_STYLE === 'true',
  },
  server: { host },
  filePath: DATA_DIR,
  secret: 'blah blah',
})

app.use('/companion', companionApp)

const { middlewares } = await createServer({
  clearScreen: false,
  server: { middlewareMode: true },
})

app.use(middlewares)
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}/...`)
})
