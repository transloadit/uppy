const fs = require('fs')
const path = require('path')
const budo = require('budo')
const router = require('router')
const companion = require('../../packages/@uppy/companion')

/**
 * Environment variables:
 *
 *   - COMPANION_AWS_REGION - Your space region, eg "ams3"
 *   - COMPANION_AWS_KEY - Your access key ID
 *   - COMPANION_AWS_SECRET - Your secret access key
 *   - COMPANION_AWS_BUCKET - Your space's name.
 */

if (!process.env.COMPANION_AWS_REGION && !process.env.UPPYSERVER_AWS_REGION) throw new Error('Missing Space region, please set the COMPANION_AWS_REGION environment variable (eg. "COMPANION_AWS_REGION=ams3")')
if (!process.env.COMPANION_AWS_KEY && !process.env.UPPYSERVER_AWS_KEY) throw new Error('Missing access key, please set the COMPANION_AWS_KEY environment variable')
if (!process.env.COMPANION_AWS_SECRET && !process.env.UPPYSERVER_AWS_SECRET) throw new Error('Missing secret key, please set the COMPANION_AWS_SECRET environment variable')
if (!process.env.COMPANION_AWS_BUCKET && !process.env.UPPYSERVER_AWS_BUCKET) throw new Error('Missing Space name, please set the COMPANION_AWS_BUCKET environment variable')

// Prepare the server.
const PORT = process.env.PORT || 3452

const app = router()

// Set up the /params endpoint that will create signed URLs for us.
app.use(require('cors')())
app.use(require('body-parser').json())
app.use('/companion', companion.app({
  providerOptions: {
    s3: {
      // This is the crucial part; set an endpoint template for the service you want to use.
      endpoint: 'https://{region}.digitaloceanspaces.com',
      getKey: (req, filename) => `uploads/${filename}`,

      key: process.env.COMPANION_AWS_KEY || process.env.UPPYSERVER_AWS_KEY,
      secret: process.env.COMPANION_AWS_SECRET || process.env.UPPYSERVER_AWS_SECRET,
      bucket: process.env.COMPANION_AWS_BUCKET || process.env.UPPYSERVER_AWS_BUCKET,
      region: process.env.COMPANION_AWS_REGION || process.env.UPPYSERVER_AWS_REGION
    }
  },
  server: { serverUrl: `localhost:${PORT}` }
}))

// Serve the built CSS file.
app.get('/uppy.min.css', (req, res) => {
  res.setHeader('content-type', 'text/css')
  fs.createReadStream(path.join('../../packages/uppy/dist/uppy.min.css')).pipe(res)
})

// Start the development server, budo.
budo(path.join(__dirname, 'main.js'), {
  live: true,
  stream: process.stdout,
  port: PORT,
  middleware: app,
  browserify: {
    transform: [
      'babelify',
      ['aliasify', {
        aliases: {
          '@uppy': path.join(__dirname, '../../packages/@uppy')
        }
      }]
    ]
  }
})
