'use strict'

const path = require('node:path')
const crypto = require('node:crypto')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const express = require('express')

const app = express()

const port = process.env.PORT ?? 8080
const bodyParser = require('body-parser')

let s3Client
const aws = require('aws-sdk')

const expires = 800 // Define how long until a S3 signature expires.

function getS3Client () {
  s3Client ??= new aws.S3({
    signatureVersion: 'v4',
    region: process.env.COMPANION_AWS_REGION,
    credentials : new aws.Credentials(
      process.env.COMPANION_AWS_KEY,
      process.env.COMPANION_AWS_SECRET,
    ),
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

app.post('/sign-s3', (req, res) => {
  const s3 = getS3Client()
  const Key = `${crypto.randomUUID()}-${req.body.filename}`
  const { contentType } = req.body
  const s3Params = {
    Bucket: process.env.COMPANION_AWS_BUCKET,
    Key,
    Expires: expires,
    ContentType: contentType,
  }

  s3.getSignedUrl('putObject', s3Params, (err, data, next) => {
    if (err) {
      next(err)
      return
    }
    const returnData = {
      url: data,
      method: 'PUT',
    }
    res.write(JSON.stringify(returnData))
    res.end()
  })
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

  return client.createMultipartUpload(params, (err, data) => {
    if (err) {
      next(err)
      return
    }
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
  const client = getS3Client()
  const { uploadId, partNumber } = req.params
  const { key } = req.query

  if (!validatePartNumber(partNumber)) {
    return res.status(400).json({ error: 's3: the part number must be an integer between 1 and 10000.' })
  }
  if (typeof key !== 'string') {
    return res.status(400).json({ error: 's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"' })
  }

  return client.getSignedUrl('uploadPart', {
    Bucket: process.env.COMPANION_AWS_BUCKET,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: '',
    Expires: expires,
  }, (err, url) => {
    if (err) {
      next(err)
      return
    }
    res.json({ url, expires })
  })
})

app.get('/s3/multipart/:uploadId', (req, res, next) => {
  const client = getS3Client()
  const { uploadId } = req.params
  const { key } = req.query

  if (typeof key !== 'string') {
    return res.status(400).json({ error: 's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"' })
  }

  const parts = []
  listPartsPage(0)

  function listPartsPage (startAt) {
    client.listParts({
      Bucket: process.env.COMPANION_AWS_BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumberMarker: startAt,
    }, (err, data) => {
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
})

function isValidPart (part) {
  return part && typeof part === 'object' && typeof part.PartNumber === 'number' && typeof part.ETag === 'string'
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

  return client.completeMultipartUpload({
    Bucket: process.env.COMPANION_AWS_BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts,
    },
  }, (err, data) => {
    if (err) {
      next(err)
      return
    }
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

  return client.abortMultipartUpload({
    Bucket: process.env.COMPANION_AWS_BUCKET,
    Key: key,
    UploadId: uploadId,
  }, (err) => {
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
