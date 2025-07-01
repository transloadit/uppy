const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const app = require('express')()
const companion = require('../../packages/@uppy/companion')

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

const DATA_DIR = path.join(__dirname, 'tmp')

fs.mkdirSync(DATA_DIR, { recursive: true })

// Set up the /params endpoint that will create signed URLs for us.
app.use(require('cors')())
app.use(require('body-parser').json())

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
  debug: true,
})

app.use('/companion', companionApp)

require('vite')
  .createServer({ clearScreen: false, server: { middlewareMode: true } })
  .then(({ middlewares }) => {
    app.use(middlewares)
    app.listen(PORT, () => {
      console.log(`Listening on http://localhost:${PORT}/...`)
    })
  })
