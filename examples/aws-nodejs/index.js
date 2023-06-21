'use strict'

const path = require('node:path')
const crypto = require('node:crypto')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const express = require('express')

const app = express()

const port = process.env.PORT ?? 8080
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

/**
 * @type {S3Client}
 */
let s3Client

const expiresIn = 900 // Define how long until a S3 signature expires.

function getS3Client () {
  s3Client ??= new S3Client({
    region: process.env.COMPANION_AWS_REGION,
    credentials : {
      accessKeyId: process.env.COMPANION_AWS_KEY,
      secretAccessKey: process.env.COMPANION_AWS_SECRET,
    },
  })
  return s3Client
}

app.use(bodyParser.json())

app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html')
  res.sendFile(htmlPath)
})

app.get('/drag', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'drag.html')
  res.sendFile(htmlPath)
})
app.get('/sign-on-the-client', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'sign-on-the-client.html')
  res.sendFile(htmlPath)
})
app.get('/createSignedURL.mjs', (req, res) => {
  const jsPath = path.join(__dirname, 'public', 'createSignedURL.mjs')
  res.header('Content-Type', 'text/javascript')
  res.sendFile(jsPath)
})

app.post('/sign-s3', (req, res, next) => {
  const Key = `${crypto.randomUUID()}-${req.body.filename}`
  const { contentType } = req.body

  getSignedUrl(getS3Client(), new PutObjectCommand({
    Bucket: process.env.COMPANION_AWS_BUCKET,
    Key,
    ContentType: contentType,
  }), { expiresIn }).then((url) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json({
      url,
      method: 'PUT',
    })
    res.end()
  }, next)
})

//  === <S3 Multipart> ===
// You can remove those endpoints if you only want to support the non-multipart uploads.

app.post('/s3/multipart', (req, res, next) => {
  const client = getS3Client()
  const { type, metadata, filename } = req.body
  if (typeof filename !== 'string') {
    return res.status(400).json({ error: 's3: content filename must be a string' })
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
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json({
      key: data.Key,
      uploadId: data.UploadId,
    })
  })
})

function validatePartNumber (partNumber) {
  // eslint-disable-next-line no-param-reassign
  partNumber = Number(partNumber)
  return Number.isInteger(partNumber) && partNumber >= 1 && partNumber <= 10_000
}
app.get('/s3/multipart/:uploadId/:partNumber', (req, res, next) => {
  const { uploadId, partNumber } = req.params
  const { key } = req.query

  if (!validatePartNumber(partNumber)) {
    return res.status(400).json({ error: 's3: the part number must be an integer between 1 and 10000.' })
  }
  if (typeof key !== 'string') {
    return res.status(400).json({ error: 's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"' })
  }

  return getSignedUrl(getS3Client(), new UploadPartCommand({
    Bucket: process.env.COMPANION_AWS_BUCKET,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: '',
  }), { expiresIn }).then((url) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json({ url, expires: expiresIn })
  }, next)
})

app.get('/s3/multipart/:uploadId', (req, res, next) => {
  const client = getS3Client()
  const { uploadId } = req.params
  const { key } = req.query

  if (typeof key !== 'string') {
    res.status(400).json({ error: 's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"' })
    return
  }

  const parts = []

  function listPartsPage (startAt) {
    client.send(new ListPartsCommand({
      Bucket: process.env.COMPANION_AWS_BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumberMarker: startAt,
    }), (err, data) => {
      if (err) {
        next(err)
        return
      }

      parts.push(...data.Parts)

      if (data.IsTruncated) {
        // Get the next page.
        listPartsPage(data.NextPartNumberMarker)
      } else {
        res.json(parts)
      }
    })
  }
  listPartsPage(0)
})

function isValidPart (part) {
  return part && typeof part === 'object' && Number(part.PartNumber) && typeof part.ETag === 'string'
}
app.post('/s3/multipart/:uploadId/complete', (req, res, next) => {
  const client = getS3Client()
  const { uploadId } = req.params
  const { key } = req.query
  const { parts } = req.body

  if (typeof key !== 'string') {
    return res.status(400).json({ error: 's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"' })
  }
  if (!Array.isArray(parts) || !parts.every(isValidPart)) {
    return res.status(400).json({ error: 's3: `parts` must be an array of {ETag, PartNumber} objects.' })
  }

  return client.send(new CompleteMultipartUploadCommand({
    Bucket: process.env.COMPANION_AWS_BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts,
    },
  }), (err, data) => {
    if (err) {
      next(err)
      return
    }
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json({
      location: data.Location,
    })
  })
})

app.delete('/s3/multipart/:uploadId', (req, res, next) => {
  const client = getS3Client()
  const { uploadId } = req.params
  const { key } = req.query

  if (typeof key !== 'string') {
    return res.status(400).json({ error: 's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"' })
  }

  return client.send(new AbortMultipartUploadCommand({
    Bucket: process.env.COMPANION_AWS_BUCKET,
    Key: key,
    UploadId: uploadId,
  }), (err) => {
    if (err) {
      next(err)
      return
    }
    res.json({})
  })
})

// === </S3 MULTIPART> ===

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
