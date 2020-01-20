# Uppy + AWS S3 Example

This example uses a server-side PHP endpoint to sign uploads to S3.

## Running It

To run this example, make sure you've correctly installed the **repository root**:
```bash
npm install
```
That will also install the npm dependencies for this example.

This example also uses the AWS PHP SDK.
To install it, [get composer](https://getcomposer.org) and run `composer update` in **this** folder.

```bash
cd ./examples/aws-presigned-url
composer update
```

Configure AWS S3 credentials using [environment variables](https://docs.aws.amazon.com/aws-sdk-php/v3/guide/guide/credentials.html#environment-credentials) or a [credentials file in `~/.aws/credentials`](https://docs.aws.amazon.com/aws-sdk-php/v3/guide/guide/credentials.html#credential-profiles).
Configure a bucket name and region in the `s3-sign.php` file.

Then, again in the **repository root**, start this example by doing:
```bash
npm run example aws-presigned-url
```
The demo should now be available at http://localhost:8080.

Optionally, provide a port in the `PORT` environment variable:
```bash
PORT=8080 npm run example aws-presigned-url
```
