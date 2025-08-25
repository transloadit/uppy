const path = require('node:path')
const crypto = require('node:crypto')
const { existsSync } = require('node:fs')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const express = require('express')

const app = express()

const port = process.env.PORT ?? 8080
const accessControlAllowOrigin = '*' // You should define the actual domain(s) that are allowed to make requests.
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

/**
 * @type {S3Client}
 */
let s3Client

/**
 * @type {STSClient}
 */
let stsClient

const expiresIn = 900 // Define how long until a S3 signature expires.

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

// Generate a unique S3 key for the file
const generateS3Key = (filename) => `${crypto.randomUUID()}-${filename}`

// Extract the file parameters from the request
const extractFileParameters = (req) => {
  const isPostRequest = req.method === 'POST'
  const params = isPostRequest ? req.body : req.query

  return {
    filename: params.filename,
    contentType: params.type,
  }
}

// Validate the file parameters
const validateFileParameters = (filename, contentType) => {
  if (!filename || !contentType) {
    throw new Error(
      'Missing required parameters: filename and content type are required',
    )
  }
}

app.use(bodyParser.urlencoded({ extended: true }), bodyParser.json())

app.get('/s3/sts', (req, res, next) => {
  // Before giving the STS token to the client, you should first check is they
  // are authorized to perform that operation, and if the request is legit.
  // For the sake of simplification, we skip that check in this example.

  getSTSClient()
    .send(
      new GetFederationTokenCommand({
        Name: '123user',
        // The duration, in seconds, of the role session. The value specified
        // can range from 900 seconds (15 minutes) up to the maximum session
        // duration set for the role.
        DurationSeconds: expiresIn,
        Policy: JSON.stringify(policy),
      }),
    )
    .then((response) => {
      // Test creating multipart upload from the server — it works
      // createMultipartUploadYo(response)
      res.setHeader('Access-Control-Allow-Origin', accessControlAllowOrigin)
      res.setHeader('Cache-Control', `public,max-age=${expiresIn}`)
      res.json({
        credentials: response.Credentials,
        bucket: process.env.COMPANION_AWS_BUCKET,
        region: process.env.COMPANION_AWS_REGION,
      })
    }, next)
})
const signOnServer = (req, res, next) => {
  // Before giving the signature to the user, you should first check is they
  // are authorized to perform that operation, and if the request is legit.
  // For the sake of simplification, we skip that check in this example.

  const { filename, contentType } = extractFileParameters(req)
  validateFileParameters(filename, contentType)

  // Generate S3 key and prepare command
  const Key = generateS3Key(filename)

  getSignedUrl(
    getS3Client(),
    new PutObjectCommand({
      Bucket: process.env.COMPANION_AWS_BUCKET,
      Key,
      ContentType: contentType,
    }),
    { expiresIn },
  ).then((url) => {
    res.setHeader('Access-Control-Allow-Origin', accessControlAllowOrigin)
    res.json({
      url,
      method: 'PUT',
    })
    res.end()
  }, next)
}
app.get('/s3/params', signOnServer)
app.post('/s3/sign', signOnServer)

//  === <S3 Multipart> ===
// You can remove those endpoints if you only want to support the non-multipart uploads.

app.post('/s3/multipart', (req, res, next) => {
  const client = getS3Client()
  const { type, metadata, filename } = req.body
  if (typeof filename !== 'string') {
    return res
      .status(400)
      .json({ error: 's3: content filename must be a string' })
  }
  if (typeof type !== 'string') {
    return res.status(400).json({ error: 's3: content type must be a string' })
  }
  const Key = `${crypto.randomUUID()}-${filename}`

  const params = {
    Bucket: process.env.COMPANION_AWS_BUCKET,
    Key,
    ContentType: type,
    Metadata: metadata,
  }

  const command = new CreateMultipartUploadCommand(params)

  return client.send(command, (err, data) => {
    if (err) {
      next(err)
      return
    }
    res.setHeader('Access-Control-Allow-Origin', accessControlAllowOrigin)
    res.json({
      key: data.Key,
      uploadId: data.UploadId,
    })
  })
})

function validatePartNumber(partNumber) {
  partNumber = Number(partNumber)
  return Number.isInteger(partNumber) && partNumber >= 1 && partNumber <= 10_000
}
app.get('/s3/multipart/:uploadId/:partNumber', (req, res, next) => {
  const { uploadId, partNumber } = req.params
  const { key } = req.query

  if (!validatePartNumber(partNumber)) {
    return res.status(400).json({
      error: 's3: the part number must be an integer between 1 and 10000.',
    })
  }
  if (typeof key !== 'string') {
    return res.status(400).json({
      error:
        's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"',
    })
  }

  return getSignedUrl(
    getS3Client(),
    new UploadPartCommand({
      Bucket: process.env.COMPANION_AWS_BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: '',
    }),
    { expiresIn },
  ).then((url) => {
    res.setHeader('Access-Control-Allow-Origin', accessControlAllowOrigin)
    res.json({ url, expires: expiresIn })
  }, next)
})

app.get('/s3/multipart/:uploadId', (req, res, next) => {
  const client = getS3Client()
  const { uploadId } = req.params
  const { key } = req.query

  if (typeof key !== 'string') {
    res.status(400).json({
      error:
        's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"',
    })
    return
  }

  const parts = []

  function listPartsPage(startsAt = undefined) {
    client.send(
      new ListPartsCommand({
        Bucket: process.env.COMPANION_AWS_BUCKET,
        Key: key,
        UploadId: uploadId,
        PartNumberMarker: startsAt,
      }),
      (err, data) => {
        if (err) {
          next(err)
          return
        }

        parts.push(...data.Parts)

        // continue to get list of all uploaded parts until the IsTruncated flag is false
        if (data.IsTruncated) {
          listPartsPage(data.NextPartNumberMarker)
        } else {
          res.json(parts)
        }
      },
    )
  }
  listPartsPage()
})

function isValidPart(part) {
  return (
    part &&
    typeof part === 'object' &&
    Number(part.PartNumber) &&
    typeof part.ETag === 'string'
  )
}
app.post('/s3/multipart/:uploadId/complete', (req, res, next) => {
  const client = getS3Client()
  const { uploadId } = req.params
  const { key } = req.query
  const { parts } = req.body

  if (typeof key !== 'string') {
    return res.status(400).json({
      error:
        's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"',
    })
  }
  if (!Array.isArray(parts) || !parts.every(isValidPart)) {
    return res.status(400).json({
      error: 's3: `parts` must be an array of {ETag, PartNumber} objects.',
    })
  }

  return client.send(
    new CompleteMultipartUploadCommand({
      Bucket: process.env.COMPANION_AWS_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    }),
    (err, data) => {
      if (err) {
        next(err)
        return
      }
      res.setHeader('Access-Control-Allow-Origin', accessControlAllowOrigin)
      res.json({
        location: data.Location,
      })
    },
  )
})

app.delete('/s3/multipart/:uploadId', (req, res, next) => {
  const client = getS3Client()
  const { uploadId } = req.params
  const { key } = req.query

  if (typeof key !== 'string') {
    return res.status(400).json({
      error:
        's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"',
    })
  }

  return client.send(
    new AbortMultipartUploadCommand({
      Bucket: process.env.COMPANION_AWS_BUCKET,
      Key: key,
      UploadId: uploadId,
    }),
    (err) => {
      if (err) {
        next(err)
        return
      }
      res.json({})
    },
  )
})

// === </S3 MULTIPART> ===

// === <some plumbing to make the example work> ===

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  const htmlPath = path.join(__dirname, 'public', 'index.html')
  res.sendFile(htmlPath)
})
app.get('/index.html', (req, res) => {
  res.setHeader('Location', '/').sendStatus(308).end()
})
app.get('/withCustomEndpoints.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  const htmlPath = path.join(__dirname, 'public', 'withCustomEndpoints.html')
  res.sendFile(htmlPath)
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
// === </some plumbing to make the example work> ===
