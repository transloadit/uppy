// Constants
export const AWS_ALGORITHM = 'AWS4-HMAC-SHA256'
export const AWS_REQUEST_TYPE = 'aws4_request'
export const S3_SERVICE = 's3'
export const LIST_TYPE = '2'
export const UNSIGNED_PAYLOAD = 'UNSIGNED-PAYLOAD'
export const DEFAULT_STREAM_CONTENT_TYPE = 'application/octet-stream'
export const XML_CONTENT_TYPE = 'application/xml'
export const JSON_CONTENT_TYPE = 'application/json'
// List of keys that might contain sensitive information
export const SENSITIVE_KEYS_REDACTED = new Set([
  'accessKeyId',
  'secretAccessKey',
  'sessionToken',
  'password',
  'token',
])
export const IFHEADERS = new Set([
  'if-match',
  'if-none-match',
  'if-modified-since',
  'if-unmodified-since',
])
export const DEFAULT_REQUEST_SIZE_IN_BYTES = 8 * 1024 * 1024

// Headers
export const HEADER_AMZ_CONTENT_SHA256 = 'x-amz-content-sha256'
export const HEADER_AMZ_CHECKSUM_SHA256 = 'x-amz-checksum-sha256'
export const HEADER_AMZ_DATE = 'x-amz-date'
export const HEADER_HOST = 'host'
export const HEADER_AUTHORIZATION = 'authorization'
export const HEADER_CONTENT_TYPE = 'content-type'
export const HEADER_CONTENT_LENGTH = 'content-length'
export const HEADER_ETAG = 'etag'
export const HEADER_LAST_MODIFIED = 'last-modified'

// Error messages
export const ERROR_PREFIX = '[s3mini] '
export const ERROR_ENDPOINT_REQUIRED = `${ERROR_PREFIX}endpoint must be a non-empty string`
export const ERROR_ENDPOINT_FORMAT = `${ERROR_PREFIX}endpoint must be a valid URL. Expected format: https://<host>[:port][/base-path]`
export const ERROR_KEY_REQUIRED = `${ERROR_PREFIX}key must be a non-empty string`
export const ERROR_UPLOAD_ID_REQUIRED = `${ERROR_PREFIX}uploadId must be a non-empty string`
export const ERROR_DATA_BUFFER_REQUIRED = `${ERROR_PREFIX}data must be a Buffer or string`
