# Uppy + AWS S3 with Node.JS

A simple and fully working example of Uppy and AWS S3 storage with Node.js (and
Express.js). It uses presigned URL at the backend level.

## AWS Configuration

It's assumed that you are familiar with AWS, at least, with the storage service
(S3) and users & policies (IAM).

These instructions are **not fit for production** but tightening the security is
out of the scope here.

### S3 Setup

- Create new S3 bucket in AWS (e.g. `aws-nodejs`).
- Add a bucket policy.

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicAccess",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::aws-nodejs/*"
      }
    ]
  }
  ```

- Make the S3 bucket public.
- Add CORS configuration.

  ```json
  [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD", "POST", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": []
    }
  ]
  ```

### AWS Credentials

You may use existing AWS credentials or create a new user in the IAM page.

- Make sure you setup the AWS credentials properly and write down the Access Key
  ID and Secret Access Key.
- You may configure AWS S3 credentials using
  [environment variables](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-node-credentials-environment.html)
  or a
  [credentials file in `~/.aws/credentials`](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html).
- You will need at least `PutObject` and `PutObjectAcl` permissions.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::aws-nodejs/*"
    }
  ]
}
```

## Prerequisites

Download this code or clone repository into a folder and install dependencies:

```sh
CYPRESS_INSTALL_BINARY=0 corepack yarn install
```

Add a `.env` file to the root directory and define the S3 bucket name and port
variables like the example below:

```
COMPANION_AWS_BUCKET=aws-nodejs
COMPANION_AWS_REGION=…
COMPANION_AWS_KEY=…
COMPANION_AWS_SECRET=…
PORT=8080
```

N.B.: This example uses `COMPANION_AWS_` environnement variables to facilitate
integrations with other examples in this repository, but this example does _not_
uses Companion at all.

## Enjoy it

Start the application:

```sh
corepack yarn workspace @uppy-example/aws-nodejs start
```

Dashboard demo should now be available at http://localhost:8080.

You have also a Drag & Drop demo on http://localhost:8080/drag.

_Feel free to check how the demo works and feel free to open an issue._
