import { parseXml } from '../../src/s3-client/utils'
import { createSigV4Signer } from './sigv4-signer.js'

/**
 * Simple STS client for testing with MinIO.
 * Implements the AssumeRole API to get temporary credentials.
 *
 * @see https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html
 */
export function createSTSClient({
  endpoint,
  accessKeyId,
  secretAccessKey,
  region = 'us-east-1',
}) {
  const signer = createSigV4Signer({
    accessKeyId,
    secretAccessKey,
    region,
    service: 'sts', // STS uses 'sts' service, not 's3'
  })

  /**
   * Get temporary security credentials using AssumeRole.
   *
   * Based on MinIO docs: https://github.com/minio/minio/blob/master/docs/sts/assume-role.md
   * Note: Despite the docs showing query params, MinIO actually requires POST with form-encoded body.
   *
   * @param {object} options
   * @param {number} options.durationSeconds - Duration of credentials (900-31536000 seconds)
   * @param {string} options.policy - Optional inline IAM policy JSON
   * @returns {Promise<{AccessKeyId: string, SecretAccessKey: string, SessionToken: string, Expiration: string}>}
   */
  async function assumeRole({ durationSeconds = 3600, policy } = {}) {
    // Build form-encoded body for STS API
    const params = new URLSearchParams()
    params.set('Action', 'AssumeRole')
    params.set('Version', '2011-06-15')
    params.set('DurationSeconds', String(durationSeconds))
    // RoleArn and RoleSessionName are not meaningful for MinIO (can be any value)
    params.set('RoleArn', 'arn:xxx:xxx:xxx:xxxx')
    params.set('RoleSessionName', 'uppy-test')

    if (policy) {
      params.set(
        'Policy',
        typeof policy === 'string' ? policy : JSON.stringify(policy),
      )
    }

    const body = params.toString()

    // Sign request with body hash (STS requires signed payload)
    const headers = await signer({
      method: 'POST',
      url: endpoint,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`STS AssumeRole failed: ${response.status} - ${text}`)
    }

    const xml = await response.text()
    return parseSTSResponse(xml)
  }

  return { assumeRole }
}

/**
 * Parse the STS AssumeRole XML response.
 *
 * Response format:
 * <AssumeRoleResponse>
 *   <AssumeRoleResult>
 *     <Credentials>
 *       <AccessKeyId>...</AccessKeyId>
 *       <SecretAccessKey>...</SecretAccessKey>
 *       <SessionToken>...</SessionToken>
 *       <Expiration>...</Expiration>
 *     </Credentials>
 *   </AssumeRoleResult>
 * </AssumeRoleResponse>
 */
function parseSTSResponse(xml) {
  const parsed = parseXml(xml)

  // Handle different response structures
  const response =
    parsed.AssumeRoleResponse || parsed.assumeRoleResponse || parsed

  const result =
    response.AssumeRoleResult || response.assumeRoleResult || response

  const credentials = result.Credentials || result.credentials

  if (!credentials) {
    throw new Error(`Failed to parse STS response: ${xml}`)
  }

  return {
    AccessKeyId: credentials.AccessKeyId || credentials.accessKeyId,
    SecretAccessKey: credentials.SecretAccessKey || credentials.secretAccessKey,
    SessionToken: credentials.SessionToken || credentials.sessionToken,
    Expiration: credentials.Expiration || credentials.expiration,
  }
}
