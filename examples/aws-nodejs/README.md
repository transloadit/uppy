# Uppy + AWS S3 with Node.JS

A simple and fully working example of Uppy and AWS S3 storage with Node.js (and
Express.js). It uses presigned URL at the backend level.

## AWS Configuration

It's assumed that you are familiar with AWS, at least, with the storage service
(S3) and users & policies (IAM).

These instructions are **not fit for production**, tightening the security is
out of the scope here.

### S3 Setup

Assuming you’re trying to setup the user `MY-UPPY-USER` to put the uploaded
files to the bucket `MY-UPPY-BUCKET`, here’s how you can allow `MY-UPPY-USER` to
get STS Federated Token and upload files to `MY-UPPY-BUCKET`:

1. Set CORS settings on `MY-UPPY-BUCKET` bucket:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "HEAD", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag", "Location"]
     }
   ]
   ```

2. Add the following Policy to `MY-UPPY-BUCKET`:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "MyMultipartPolicyStatement1",
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::*:user/MY-UPPY-USER"
         },
         "Action": [
           "s3:PutObject",
           "s3:PutObjectAcl",
           "s3:ListMultipartUploadParts",
           "s3:AbortMultipartUpload"
         ],
         "Resource": "arn:aws:s3:::MY-UPPY-BUCKET/*"
       }
     ]
   }
   ```

3. Add the following Policy to `MY-UPPY-USER`: (if you don’t want to enable
   signing on the client, you can skip this step)
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "MyStsPolicyStatement1",
         "Effect": "Allow",
         "Action": ["sts:GetFederationToken"],
         "Resource": ["arn:aws:sts::*:federated-user/*"]
       }
     ]
   }
   ```

### AWS Credentials

You may use existing AWS credentials or create a new user in the IAM page.

- Make sure you setup the AWS credentials properly and write down the Access Key
  ID and Secret Access Key.
- You may configure AWS S3 credentials using
  [environment variables](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-node-credentials-environment.html)
  or a
  [credentials file in `~/.aws/credentials`](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html).

## Prerequisites

Download this code or clone repository into a folder and install dependencies:

```sh
CYPRESS_INSTALL_BINARY=0 corepack yarn install
```

Add a `.env` file to the root directory and define the S3 bucket name and port
variables like the example below:

```
COMPANION_AWS_BUCKET=MY-UPPY-BUCKET
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

_Feel free to check how the demo works and feel free to open an issue._
