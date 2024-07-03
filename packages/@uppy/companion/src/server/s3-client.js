const { S3Client } = require('@aws-sdk/client-s3')

/**
 * instantiates the aws-sdk s3 client that will be used for s3 uploads.
 *
 * @param {object} companionOptions the companion options object
 * @param {boolean} createPresignedPostMode whether this s3 client is for createPresignedPost
 */
module.exports = (companionOptions, createPresignedPostMode = false) => {
  let s3Client = null
  if (companionOptions.s3) {
    const { s3 } = companionOptions

    if (s3.accessKeyId || s3.secretAccessKey) {
      throw new Error('Found `providerOptions.s3.accessKeyId` or `providerOptions.s3.secretAccessKey` configuration, but Companion requires `key` and `secret` option names instead. Please use the `key` property instead of `accessKeyId` and the `secret` property instead of `secretAccessKey`.')
    }

    const rawClientOptions = s3.awsClientOptions
    if (rawClientOptions && (rawClientOptions.accessKeyId || rawClientOptions.secretAccessKey)) {
      throw new Error('Found unsupported `providerOptions.s3.awsClientOptions.accessKeyId` or `providerOptions.s3.awsClientOptions.secretAccessKey` configuration. Please use the `providerOptions.s3.key` and `providerOptions.s3.secret` options instead.')
    }

    let { endpoint } = s3
    if (typeof endpoint === 'string') {
      // TODO: deprecate those replacements in favor of what AWS SDK supports out of the box.
      endpoint = endpoint.replace(/{service}/, 's3').replace(/{region}/, s3.region)
    }

    /** @type {import('@aws-sdk/client-s3').S3ClientConfig} */
    let s3ClientOptions = {
      region: s3.region,
      forcePathStyle: s3.forcePathStyle
    }

    if (s3.useAccelerateEndpoint) {
      // https://github.com/transloadit/uppy/issues/4809#issuecomment-1847320742
      if (createPresignedPostMode) {
        if (s3.bucket != null) {
          s3ClientOptions = {
            ...s3ClientOptions,
            useAccelerateEndpoint: true,
            // This is a workaround for lacking support for useAccelerateEndpoint in createPresignedPost
            // See https://github.com/transloadit/uppy/issues/4135#issuecomment-1276450023
            endpoint: `https://${s3.bucket}.s3-accelerate.amazonaws.com/`,
          }
        }
      } else { // normal useAccelerateEndpoint mode
        s3ClientOptions = {
          ...s3ClientOptions,
          useAccelerateEndpoint: true,
        }
      }
    } else { // no accelearate, we allow custom s3 endpoint
      s3ClientOptions = {
        ...s3ClientOptions,
        endpoint,
      }
    }

    s3ClientOptions = {
      ...s3ClientOptions,
      ...rawClientOptions,
    }

    // Use credentials to allow assumed roles to pass STS sessions in.
    // If the user doesn't specify key and secret, the default credentials (process-env)
    // will be used by S3 in calls below.
    if (s3.key && s3.secret && !s3ClientOptions.credentials) {
      s3ClientOptions.credentials = {
        accessKeyId: s3.key,
        secretAccessKey: s3.secret,
        sessionToken: s3.sessionToken,
      }
    }
    s3Client = new S3Client(s3ClientOptions)
  }

  return s3Client
}
