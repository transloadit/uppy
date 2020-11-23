/**
 * instantiates the aws-sdk s3 client that will be used for s3 uploads.
 *
 * @param {object} companionOptions the companion options object
 */
module.exports = (companionOptions) => {
  let s3Client = null
  if (companionOptions.providerOptions.s3) {
    const S3 = require('aws-sdk/clients/s3')
    const AWS = require('aws-sdk')
    const s3ProviderOptions = companionOptions.providerOptions.s3

    if (s3ProviderOptions.accessKeyId || s3ProviderOptions.secretAccessKey) {
      throw new Error('Found `providerOptions.s3.accessKeyId` or `providerOptions.s3.secretAccessKey` configuration, but Companion requires `key` and `secret` option names instead. Please use the `key` property instead of `accessKeyId` and the `secret` property instead of `secretAccessKey`.')
    }

    const rawClientOptions = s3ProviderOptions.awsClientOptions
    if (rawClientOptions && (rawClientOptions.accessKeyId || rawClientOptions.secretAccessKey)) {
      throw new Error('Found unsupported `providerOptions.s3.awsClientOptions.accessKeyId` or `providerOptions.s3.awsClientOptions.secretAccessKey` configuration. Please use the `providerOptions.s3.key` and `providerOptions.s3.secret` options instead.')
    }

    const s3ClientOptions = Object.assign({
      signatureVersion: 'v4',
      endpoint: s3ProviderOptions.endpoint,
      region: s3ProviderOptions.region,
      // backwards compat
      useAccelerateEndpoint: s3ProviderOptions.useAccelerateEndpoint
    }, rawClientOptions)

    // Use credentials to allow assumed roles to pass STS sessions in.
    // If the user doesn't specify key and secret, the default credentials (process-env)
    // will be used by S3 in calls below.
    if (s3ProviderOptions.key && s3ProviderOptions.secret && !s3ClientOptions.credentials) {
      s3ClientOptions.credentials = new AWS.Credentials(
        s3ProviderOptions.key,
        s3ProviderOptions.secret,
        s3ProviderOptions.sessionToken)
    }
    s3Client = new S3(s3ClientOptions)
  }

  return s3Client
}
