const path = require('node:path')
const { existsSync } = require('node:fs')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const express = require('express')
const bodyParser = require('body-parser')

const app = express()
const port = process.env.PORT ?? 8080

app.use(bodyParser.json())

// --- S3 signing routes ---
app.use(require('./routes/sts'))
app.use(require('./routes/presign'))

// ---------------------------------------------------------------------------
// Static file serving
// ---------------------------------------------------------------------------

app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html')
  require('node:fs').readFile(htmlPath, 'utf8', (err, html) => {
    if (err) return res.status(500).send('Error loading page')
    // Inject bucket/region config so the client can read them.
    const config = `<script>
      window.UPPY_S3_BUCKET = "${process.env.COMPANION_AWS_BUCKET}";
      window.UPPY_S3_REGION = "${process.env.COMPANION_AWS_REGION}";
    </script>`
    res.setHeader('Content-Type', 'text/html')
    res.send(html.replace('</head>', `${config}</head>`))
  })
})
app.get('/index.html', (req, res) => {
  res.setHeader('Location', '/').sendStatus(308).end()
})

app.get('/uppy.min.mjs', (req, res) => {
  res.setHeader('Content-Type', 'text/javascript')
  const bundlePath = path.join(
    __dirname,
    '../..',
    'packages/uppy/dist',
    'uppy.min.mjs',
  )
  if (existsSync(bundlePath)) {
    res.sendFile(bundlePath)
  } else {
    console.warn(
      'No local JS bundle found, using the CDN as a fallback. Run `corepack yarn build` to make this warning disappear.',
    )
    res.end(
      'export * from "https://releases.transloadit.com/uppy/v4.0.0-beta.11/uppy.min.mjs";\n',
    )
  }
})
app.get('/uppy.min.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css')
  const bundlePath = path.join(
    __dirname,
    '../..',
    'packages/uppy/dist',
    'uppy.min.css',
  )
  if (existsSync(bundlePath)) {
    res.sendFile(bundlePath)
  } else {
    console.warn(
      'No local CSS bundle found, using the CDN as a fallback. Run `corepack yarn build` to make this warning disappear.',
    )
    res.end(
      '@import "https://releases.transloadit.com/uppy/v4.0.0-beta.11/uppy.min.css";\n',
    )
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}.`)
  console.log(`Visit http://localhost:${port}/ on your browser to try it.`)
})
