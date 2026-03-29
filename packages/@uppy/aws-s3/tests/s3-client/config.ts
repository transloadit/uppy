export const accessKeyId = 'stsuser'
export const secretAccessKey = 'stspassword123'

export function getConfig(env: Record<string, string | undefined>) {
  const config = env['VITE_MINIO_CONFIG']
  if (!config) {
    return undefined
  }
  const [rootAccessKeyId, rootSecretAccessKey, endpoint, region] =
    config.split(',')
  // Use stsuser credentials for all tests (readwrite policy is sufficient)
  // Root credentials are kept for Docker container startup
  return { endpoint, region, rootAccessKeyId, rootSecretAccessKey }
}
