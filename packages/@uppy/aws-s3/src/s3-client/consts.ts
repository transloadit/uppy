// Constants
export const AWS_ALGORITHM = 'AWS4-HMAC-SHA256'
export const AWS_REQUEST_TYPE = 'aws4_request'
export const S3_SERVICE = 's3'
export const UNSIGNED_PAYLOAD = 'UNSIGNED-PAYLOAD'
export const DEFAULT_STREAM_CONTENT_TYPE = 'application/octet-stream'
export const XML_CONTENT_TYPE = 'application/xml'
export const DEFAULT_REQUEST_SIZE_IN_BYTES = 8 * 1024 * 1024

// Error messages
export const ERROR_PREFIX = '[s3mini] '
export const ERROR_ENDPOINT_REQUIRED = `${ERROR_PREFIX}endpoint must be a non-empty string`
export const ERROR_ENDPOINT_FORMAT = `${ERROR_PREFIX}endpoint must be a valid URL. Expected format: https://<host>[:port][/base-path]`
export const ERROR_KEY_REQUIRED = `${ERROR_PREFIX}key must be a non-empty string`
export const ERROR_UPLOAD_ID_REQUIRED = `${ERROR_PREFIX}uploadId must be a non-empty string`
