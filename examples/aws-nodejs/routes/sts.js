/**
 * GET /s3/sts — Temporary credentials for client-side signing (getCredentials)
 *
 * Returns short-lived STS credentials so the browser can sign S3 requests
 * locally using SigV4. The credentials are scoped to PutObject only.
 */

const { Router } = require('express')
const { STSClient, GetFederationTokenCommand } = require('@aws-sdk/client-sts')

const expiresIn = 900 // 15 minutes

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
