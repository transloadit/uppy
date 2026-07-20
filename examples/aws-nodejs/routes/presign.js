/**
 * POST /s3/presign — Presigned URLs for server-side signing (signRequest)
 *
 * The client sends the S3 operation details (method, key, uploadId, etc.)
 * and this endpoint returns a presigned URL. The browser then sends the
 * actual request directly to S3 using that URL.
 */

const { Router } = require('express')
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

const expiresIn = 900 // 15 minutes

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

const router = Router()

router.post('/s3/presign', async (req, res, next) => {
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
    } else if (method === 'PUT' && !uploadId && !partNumber) {
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

module.exports = router
