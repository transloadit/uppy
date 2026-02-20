const path = require('node:path')
const { existsSync } = require('node:fs')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const express = require('express')
const bodyParser = require('body-parser')

const {
  S3Client,
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  PutObjectCommand,
  UploadPartCommand,
} = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { STSClient, GetFederationTokenCommand } = require('@aws-sdk/client-sts')

const app = express()
const port = process.env.PORT ?? 8080

const expiresIn = 900 // Signature expiry in seconds (15 minutes)

// IAM policy for the federated user — allows PutObject to the bucket.
const policy = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: ['s3:PutObject'],
      Resource: [
        `arn:aws:s3:::${process.env.COMPANION_AWS_BUCKET}/*`,
        `arn:aws:s3:::${process.env.COMPANION_AWS_BUCKET}`,
      ],
    },
  ],
}

let s3Client
function getS3Client() {
  s3Client ??= new S3Client({
    region: process.env.COMPANION_AWS_REGION,
    credentials: {
      accessKeyId: process.env.COMPANION_AWS_KEY,
      secretAccessKey: process.env.COMPANION_AWS_SECRET,
    },
    forcePathStyle: process.env.COMPANION_AWS_FORCE_PATH_STYLE === 'true',
  })
  return s3Client
}

let stsClient
function getSTSClient() {
  stsClient ??= new STSClient({
    region: process.env.COMPANION_AWS_REGION,
    credentials: {
      accessKeyId: process.env.COMPANION_AWS_KEY,
      secretAccessKey: process.env.COMPANION_AWS_SECRET,
    },
  })
  return stsClient
}

app.use(bodyParser.json())

// ---------------------------------------------------------------------------
// GET /s3/sts — Temporary credentials for client-side signing (getCredentials)
// ---------------------------------------------------------------------------

app.get('/s3/sts', (req, res, next) => {
  // Before giving the STS token to the client, you should first check if they
  // are authorized to perform that operation, and if the request is legit.
  // For the sake of simplification, we skip that check in this example.

  getSTSClient()
    .send(
      new GetFederationTokenCommand({
        Name: '123user',
        DurationSeconds: expiresIn,
        Policy: JSON.stringify(policy),
      }),
    )
    .then((response) => {
      res.setHeader('Cache-Control', `public,max-age=${expiresIn}`)
      res.json({
        credentials: response.Credentials,
        bucket: process.env.COMPANION_AWS_BUCKET,
        region: process.env.COMPANION_AWS_REGION,
      })
    }, next)
})

// ---------------------------------------------------------------------------
// POST /s3/presign — Presigned URLs for server-side signing (signRequest)
// ---------------------------------------------------------------------------

app.post('/s3/presign', async (req, res, next) => {
  // Before giving the presigned URL to the client, you should first check if
  // they are authorized to perform that operation, and if the request is legit.
  // For the sake of simplification, we skip that check in this example.

  try {
    const { method, key, uploadId, partNumber, contentType } = req.body
    const client = getS3Client()
    const bucket = process.env.COMPANION_AWS_BUCKET

    if (!method || !key) {
      return res.status(400).json({ error: 'method and key are required' })
    }

    let command

    if (method === 'PUT' && uploadId && partNumber) {
      // UploadPart (multipart)
      command = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: parseInt(partNumber, 10),
      })
    } else if (method === 'PUT') {
      // PutObject (simple upload)
      command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType || 'application/octet-stream',
      })
    } else if (method === 'POST' && !uploadId) {
      // CreateMultipartUpload
      command = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType || 'application/octet-stream',
      })
    } else if (method === 'POST' && uploadId) {
      // CompleteMultipartUpload
      command = new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      })
    } else if (method === 'DELETE' && uploadId) {
      // AbortMultipartUpload
      command = new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      })
    } else if (method === 'GET' && uploadId) {
      // ListParts
      command = new ListPartsCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      })
    } else {
      return res.status(400).json({ error: 'Unsupported operation' })
    }

    const url = await getSignedUrl(client, command, { expiresIn })
    res.json({ url })
  } catch (err) {
    next(err)
  }
})

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
