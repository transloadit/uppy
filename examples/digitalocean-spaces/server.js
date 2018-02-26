const fs = require('fs')
const path = require('path')
const budo = require('budo')
const router = require('router')
const bodyParser = require('body-parser')
const S3 = require('aws-sdk/clients/s3')

/**
 * Environment variables:
 *
 *   - DO_REGION - Your space region, eg "ams3"
 *   - DO_ACCESS_KEY - Your access key ID
 *   - DO_SECRET_KEY - Your secret access key
 *   - DO_SPACE - Your space's name.
 */

if (!process.env.DO_REGION) throw new Error('Missing Space region, please set the DO_REGION environment variable (eg. "DO_REGION=ams3")')
if (!process.env.DO_ACCESS_KEY) throw new Error('Missing access key, please set the DO_ACCESS_KEY environment variable')
if (!process.env.DO_SECRET_KEY) throw new Error('Missing secret key, please set the DO_SECRET_KEY environment variable')
if (!process.env.DO_SPACE) throw new Error('Missing Space name, please set the DO_SPACE environment variable')

// Prepare the server.
const PORT = process.env.PORT || 3452

const app = router()

// Set up the /params endpoint that will create signed URLs for us.
const s3 = new S3({
  endpoint: `${process.env.DO_REGION}.digitaloceanspaces.com`,
  accessKeyId: process.env.DO_ACCESS_KEY,
  secretAccessKey: process.env.DO_SECRET_KEY
})
app.use(bodyParser.json())
app.post('/params', (req, res, next) => {
  const { filename, contentType } = req.body
  s3.getSignedUrl('putObject', {
    Bucket: process.env.DO_SPACE,
    Key: filename,
    ContentType: contentType,
    Expires: 5 * 60 * 1000 // 5 minutes
  }, (err, data) => {
    if (err) return next(err)

    res.json({ method: 'put', url: data })
  })
})

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
      'aliasify'
    ]
  }
})
