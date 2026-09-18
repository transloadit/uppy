import { existsSync, readFile } from 'node:fs'
import path from 'node:path'
import bodyParser from 'body-parser'
import express from 'express'
import { presign } from './routes/presign.ts'
import { sts } from './routes/sts.ts'

process.loadEnvFile(path.resolve(import.meta.dirname, '..', '..', '.env'))

const app = express()
const port = process.env.PORT ?? 8080

app.use(bodyParser.json())

// --- S3 signing routes ---
app.use(sts)
app.use(presign)

// ---------------------------------------------------------------------------
// Static file serving
// ---------------------------------------------------------------------------

app.get('/', (req, res) => {
  const htmlPath = path.join(import.meta.dirname, 'public', 'index.html')
  readFile(htmlPath, 'utf8', (err, html) => {
    if (err) return res.status(500).send('Error loading page')
    // Inject bucket/region config so the client can read them.
    const config = `<script>
      window.UPPY_S3_BUCKET = ${JSON.stringify(process.env.COMPANION_AWS_BUCKET)};
      window.UPPY_S3_REGION = ${JSON.stringify(process.env.COMPANION_AWS_REGION)};
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
  const bundlePath = path.resolve(
    import.meta.dirname,
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
  const bundlePath = path.resolve(
    import.meta.dirname,
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
