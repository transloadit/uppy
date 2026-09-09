# Uppy + AWS S3 with Node.JS

A simple and fully working example of Uppy and AWS S3 storage with a Node.js
(Express.js) backend. It demonstrates two signing modes:

- **Client-side signing (STS)** — The server issues temporary credentials via
  `GET /s3/sts`. The browser signs S3 requests locally using SigV4.
- **Server-side signing (presigned URLs)** — The browser sends each S3 operation
  to `POST /s3/presign`. The server generates a presigned URL; the browser uses
  it directly.

Both demos also use `@uppy/golden-retriever`, so selected files and in-progress
multipart uploads survive a page reload. Resuming issues a `ListParts` request
through the signing endpoint.

Uploads land at `uppy-nodejs-example/<random-uuid>-<filename>`. The plugin's
default [`generateObjectKey`](https://uppy.io/docs/aws-s3/#generateobjectkeyfile)
prepends the UUID, and `POST /s3/presign` prepends the directory and returns the
final key to Uppy, which reports it in `upload-success`.

`@uppy/aws-s3` only switches to multipart for files larger than 100&nbsp;MiB by
default ([`shouldUseMultipart`](https://uppy.io/docs/aws-s3/#shouldusemultipartfile)).
Below that size every upload is a single `PUT`, so the multipart permissions and
the `POST`/`GET`/`DELETE` branches of `/s3/presign` are never exercised.

## AWS Configuration

It's assumed that you are familiar with AWS, at least, with the storage service
(S3) and users & policies (IAM).

These instructions are **not fit for production**, tightening the security is
out of the scope here.

### S3 Setup

Assuming you're trying to setup the user `MY-UPPY-USER` to put the uploaded
files to the bucket `MY-UPPY-BUCKET`, here's how you can allow `MY-UPPY-USER` to
get STS Federated Token and upload files to `MY-UPPY-BUCKET`:

1. Set CORS settings on `MY-UPPY-BUCKET` bucket:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

   `ETag` must be exposed or multipart uploads cannot be completed. `GET` and
   `DELETE` are only needed for the multipart list-parts and abort calls.

2. Add the following Policy to `MY-UPPY-BUCKET`, replacing `ACCOUNT-ID` with
   your 12-digit AWS account ID (S3 rejects wildcards inside a principal ARN):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "MyMultipartPolicyStatement1",
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::ACCOUNT-ID:user/MY-UPPY-USER"
         },
         "Action": [
           "s3:PutObject",
           "s3:ListMultipartUploadParts",
           "s3:AbortMultipartUpload"
         ],
         "Resource": "arn:aws:s3:::MY-UPPY-BUCKET/*"
       }
     ]
   }
   ```

3. Add the following Policy to `MY-UPPY-USER`: (required for client-side signing
   via the STS endpoint)

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "MyStsPolicyStatement1",
         "Effect": "Allow",
         "Action": ["sts:GetFederationToken"],
         "Resource": ["arn:aws:sts::*:federated-user/*"]
       },
       {
         "Sid": "MyStsPolicyStatement2",
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:ListMultipartUploadParts",
           "s3:AbortMultipartUpload"
         ],
         "Resource": "arn:aws:s3:::MY-UPPY-BUCKET/*"
       }
     ]
   }
   ```

   The S3 statement is required as well as the bucket policy: a
   `GetFederationToken` session gets the **intersection** of this user's
   identity-based policies and the session policy that `routes/sts.js` passes in
   the call. Without S3 actions here the intersection is empty and every
   client-side upload fails with `AccessDenied`.

### AWS Credentials

You may use existing AWS credentials or create a new user in the IAM page.

- Make sure you setup the AWS credentials properly and write down the Access Key
  ID and Secret Access Key.
- This example reads credentials **only** from `COMPANION_AWS_KEY` and
  `COMPANION_AWS_SECRET` (see `routes/sts.js` and `routes/presign.js`). Both
  clients are constructed with an explicit `credentials` object, which bypasses
  the AWS SDK's default provider chain, so `AWS_ACCESS_KEY_ID`, `AWS_PROFILE`
  and `~/.aws/credentials` are ignored. Remove that `credentials` block from
  both files if you want the default chain instead.

## Prerequisites

Node.js 22 or newer, and a clone of the whole `uppy` repository — this example
is a Yarn workspace and reads both the `.env` file and the Uppy browser bundle
from the repository root, so the folder cannot be used standalone.

From the root of the repository, install dependencies and build the browser
bundle this example serves:

```sh
corepack yarn install
corepack yarn build
```

The build step is required. Without `packages/uppy/dist/uppy.min.mjs` the server
falls back to an old Uppy release from the CDN that has none of the options this
example uses, and the demo silently fails at upload time.

Add a `.env` file **at the root of the repository** (the same directory as
`package.json` and `.env.example`, not `examples/aws-nodejs/`) — `index.js`
loads `../../.env`. You can start from `cp .env.example .env`.

```
COMPANION_AWS_BUCKET=MY-UPPY-BUCKET
COMPANION_AWS_REGION=…
COMPANION_AWS_KEY=…
COMPANION_AWS_SECRET=…
PORT=8080

# Optional, server-side signing only: path-style addressing for
# S3-compatible endpoints such as MinIO or LocalStack.
# COMPANION_AWS_FORCE_PATH_STYLE=true
```

N.B.: This example uses `COMPANION_AWS_` environment variables to facilitate
integrations with other examples in this repository, but this example does _not_
use Companion at all.

## Enjoy it

Start the application:

```sh
corepack yarn workspace example-aws-nodejs start
```

Dashboard demo should now be available at http://localhost:8080.

_Feel free to check how the demo works and feel free to open an issue._
