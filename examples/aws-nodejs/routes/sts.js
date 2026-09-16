/**
 * GET /s3/sts — Temporary credentials for client-side signing (getCredentials)
 *
 * Returns short-lived STS credentials so the browser can sign S3 requests
 * locally using SigV4. The credentials allow uploading, resuming and
 * aborting multipart uploads, and only under the example's own prefix.
 */

const { Router } = require('express')
const { STSClient, GetFederationTokenCommand } = require('@aws-sdk/client-sts')

const expiresIn = 900 // 15 minutes

// Must match the prefix used by routes/presign.js and by generateObjectKey in
// public/index.html, since the policy below is scoped to it.
const directory = 'uppy-nodejs-example'

// IAM policy for the federated user — allows uploads under the example's
// prefix. This endpoint is unauthenticated, so keep the scope as narrow as
// possible: AbortMultipartUpload is destructive, and a bucket-wide grant would
// let any caller abort unrelated uploads.
const policy = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      // ListMultipartUploadParts and AbortMultipartUpload are needed because
      // files over 100MiB use multipart: GoldenRetriever resumes via ListParts,
      // and cancelling an upload aborts it in S3.
      Action: [
        's3:PutObject',
        's3:ListMultipartUploadParts',
        's3:AbortMultipartUpload',
      ],
      Resource: [
        `arn:aws:s3:::${process.env.COMPANION_AWS_BUCKET}/${directory}/*`,
      ],
    },
  ],
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

const router = Router()

router.get('/s3/sts', (req, res, next) => {
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

module.exports = router
