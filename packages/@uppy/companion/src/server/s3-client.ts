import type { S3ClientConfig } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'
import type { CompanionRuntimeOptions } from '../types/companion-options.js'
import { isRecord } from './helpers/type-guards.js'

/**
 * instantiates the aws-sdk s3 client that will be used for s3 uploads.
 *
 * @param companionOptions the companion options object
 * @param createPresignedPostMode whether this s3 client is for createPresignedPost
 */
export default function s3Client(
  companionOptions: CompanionRuntimeOptions,
  createPresignedPostMode = false,
): S3Client | null {
  let s3Client: S3Client | null = null
  const s3Value = companionOptions.s3
  if (s3Value && isRecord(s3Value)) {
    const s3 = s3Value

    const getString = (obj: Record<string, unknown>, key: string): string | undefined => {
      const v = obj[key]
      return typeof v === 'string' ? v : undefined
    }
    const getBool = (obj: Record<string, unknown>, key: string): boolean | undefined => {
      const v = obj[key]
      return typeof v === 'boolean' ? v : undefined
    }

    if (s3.accessKeyId || s3.secretAccessKey) {
      throw new Error(
        'Found `providerOptions.s3.accessKeyId` or `providerOptions.s3.secretAccessKey` configuration, but Companion requires `key` and `secret` option names instead. Please use the `key` property instead of `accessKeyId` and the `secret` property instead of `secretAccessKey`.',
      )
    }

    const rawClientOptions =
      isRecord(s3.awsClientOptions) ? s3.awsClientOptions : undefined
    if (
      rawClientOptions &&
      (rawClientOptions.accessKeyId || rawClientOptions.secretAccessKey)
    ) {
      throw new Error(
        'Found unsupported `providerOptions.s3.awsClientOptions.accessKeyId` or `providerOptions.s3.awsClientOptions.secretAccessKey` configuration. Please use the `providerOptions.s3.key` and `providerOptions.s3.secret` options instead.',
      )
    }

    const region =
      getString(s3, 'region') ??
      (rawClientOptions && typeof rawClientOptions.region === 'string'
        ? rawClientOptions.region
        : undefined)
    if (!region) {
      // No region means this Companion instance isn't configured for S3 uploads.
      return null
    }

    let endpoint: unknown = s3.endpoint
    if (typeof endpoint === 'string') {
      // TODO: deprecate those replacements in favor of what AWS SDK supports out of the box.
      endpoint = endpoint
        .replace(/{service}/, 's3')
        .replace(/{region}/, region)
    }

    let s3ClientOptions: S3ClientConfig = {
      region,
      forcePathStyle: getBool(s3, 'forcePathStyle'),
    }

    const useAccelerateEndpoint = getBool(s3, 'useAccelerateEndpoint') === true
    if (useAccelerateEndpoint) {
      // https://github.com/transloadit/uppy/issues/4809#issuecomment-1847320742
      if (createPresignedPostMode) {
        const bucket = getString(s3, 'bucket')
        if (bucket != null) {
          s3ClientOptions = {
            ...s3ClientOptions,
            useAccelerateEndpoint: true,
            // This is a workaround for lacking support for useAccelerateEndpoint in createPresignedPost
            // See https://github.com/transloadit/uppy/issues/4135#issuecomment-1276450023
            endpoint: `https://${bucket}.s3-accelerate.amazonaws.com/`,
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
      s3ClientOptions = {
        ...s3ClientOptions,
        endpoint: typeof endpoint === 'string' ? endpoint : undefined,
      }
    }

    if (rawClientOptions) {
      s3ClientOptions = {
        ...s3ClientOptions,
        ...rawClientOptions,
      }
    }

    // Use credentials to allow assumed roles to pass STS sessions in.
    // If the user doesn't specify key and secret, the default credentials (process-env)
    // will be used by S3 in calls below.
    const key = getString(s3, 'key')
    const secret = getString(s3, 'secret')
    const sessionToken = getString(s3, 'sessionToken')
    if (key && secret && !s3ClientOptions.credentials) {
      s3ClientOptions.credentials = {
        accessKeyId: key,
        secretAccessKey: secret,
        sessionToken,
      }
    }
    s3Client = new S3Client(s3ClientOptions)
  }

  return s3Client
}
