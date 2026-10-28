import { S3Client, type S3ClientConfig } from '@aws-sdk/client-s3'
import type { S3ClientOptions } from '../schemas/companion.js'

export type { S3ClientOptions }

/**
 * Instantiates an aws-sdk S3 client: for uploads (the top-level `s3` option)
 * or for an S3 provider (`providerOptions.s3`, `providerOptions['transloadit-storage']`).
 *
 * @param companionOptions the companion options object
 * @param createPresignedPostMode whether this s3 client is for createPresignedPost
 */
export default function s3Client(
  companionOptions: { s3?: S3ClientOptions | undefined },
  createPresignedPostMode = false,
): S3Client | null {
  let s3Client: S3Client | null = null
  const s3 = companionOptions.s3
  if (s3) {
    if (s3['accessKeyId'] || s3['secretAccessKey']) {
      throw new Error(
        'Found `accessKeyId` or `secretAccessKey` in the S3 options, but Companion requires the option names `key` and `secret` instead.',
      )
    }

    if (
      s3['awsClientOptions']?.['accessKeyId'] ||
      s3['awsClientOptions']?.['secretAccessKey']
    ) {
      throw new Error(
        'Found unsupported `awsClientOptions.accessKeyId` or `awsClientOptions.secretAccessKey` in the S3 options. Use the `key` and `secret` options next to `awsClientOptions` instead.',
      )
    }

    let {
      endpoint,
      region,
      forcePathStyle,
      bucket,
      key,
      secret,
      sessionToken,
      useAccelerateEndpoint,
      awsClientOptions,
    } = s3

    if (endpoint && region) {
      // TODO: deprecate those replacements in favor of what AWS SDK supports out of the box.
      endpoint = endpoint.replace(/{service}/, 's3').replace(/{region}/, region)
    }

    let s3ClientOptions: S3ClientConfig = {
      ...(region != null && { region }),
      ...(forcePathStyle != null && { forcePathStyle }),
    }

    if (useAccelerateEndpoint) {
      // https://github.com/transloadit/uppy/issues/4809#issuecomment-1847320742
      if (createPresignedPostMode) {
        if (bucket != null) {
          s3ClientOptions = {
            ...s3ClientOptions,
            useAccelerateEndpoint: true,
            // This is a workaround for lacking support for useAccelerateEndpoint in createPresignedPost
            // See https://github.com/transloadit/uppy/issues/4135#issuecomment-1276450023
            endpoint: `https://${s3.bucket}.s3-accelerate.amazonaws.com/`,
          }
        }
      } else {
        // normal useAccelerateEndpoint mode
        s3ClientOptions = {
          ...s3ClientOptions,
          useAccelerateEndpoint: true,
        }
      }
    } else {
      // no accelearate, we allow custom s3 endpoint
      if (endpoint != null) {
        s3ClientOptions = {
          ...s3ClientOptions,
          endpoint,
        }
      }
    }

    if (awsClientOptions) {
      s3ClientOptions = {
        ...s3ClientOptions,
        ...awsClientOptions,
      }
    }

    // Use credentials to allow assumed roles to pass STS sessions in.
    // If the user doesn't specify key and secret, the default credentials (process-env)
    // will be used by S3 in calls below.
    if (key && secret && !s3ClientOptions.credentials) {
      s3ClientOptions.credentials = {
        accessKeyId: key,
        secretAccessKey: secret,
        ...(sessionToken ? { sessionToken } : {}),
      }
    }
    try {
      s3Client = new S3Client(s3ClientOptions)
    } catch (err) {
      // Keep S3 optional when no region can be resolved at all.
      if (err instanceof Error && err.message === 'Region is missing') {
        return null
      }
      throw err
    }
  }

  return s3Client
}
