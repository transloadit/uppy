const fs = require('fs')
const path = require('path')
const budo = require('budo')
const router = require('router')
const uppy = require('uppy-server')

/**
 * Environment variables:
 *
 *   - UPPYSERVER_AWS_REGION - Your space region, eg "ams3"
 *   - UPPYSERVER_AWS_KEY - Your access key ID
 *   - UPPYSERVER_AWS_SECRET - Your secret access key
 *   - UPPYSERVER_AWS_BUCKET - Your space's name.
 */

if (!process.env.UPPYSERVER_AWS_REGION) throw new Error('Missing Space region, please set the UPPYSERVER_AWS_REGION environment variable (eg. "UPPYSERVER_AWS_REGION=ams3")')
if (!process.env.UPPYSERVER_AWS_KEY) throw new Error('Missing access key, please set the UPPYSERVER_AWS_KEY environment variable')
if (!process.env.UPPYSERVER_AWS_SECRET) throw new Error('Missing secret key, please set the UPPYSERVER_AWS_SECRET environment variable')
if (!process.env.UPPYSERVER_AWS_BUCKET) throw new Error('Missing Space name, please set the UPPYSERVER_AWS_BUCKET environment variable')

// Prepare the server.
const PORT = process.env.PORT || 3452

const app = router()

// Set up the /params endpoint that will create signed URLs for us.
app.use(require('cors')())
app.use(require('body-parser').json())
app.use('/uppy-server', uppy.app({
  providerOptions: {
    s3: {
      // This is the crucial part; set an endpoint template for the service you want to use.
      endpoint: 'https://{region}.digitaloceanspaces.com',
      getKey: (req, filename) => `uploads/${filename}`,

      key: process.env.UPPYSERVER_AWS_KEY,
      secret: process.env.UPPYSERVER_AWS_SECRET,
      bucket: process.env.UPPYSERVER_AWS_BUCKET,
      region: process.env.UPPYSERVER_AWS_REGION
    }
  },
  server: { host: `localhost:${PORT}` }
}))

// Serve the built CSS file.
app.get('/uppy.min.css', (req, res) => {
  res.setHeader('content-type', 'text/css')
  fs.createReadStream(path.join('../../dist/uppy.min.css')).pipe(res)
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
        replacements: {
          '^uppy/lib/(.*?)$': path.join(__dirname, '../../src/$1')
        }
      }]
    ]
  }
})
