'use strict';

// Export the S3 class as default export and named export
export { S3mini } from './S3.js';
export { sanitizeETag, runInBatches } from './utils.js';

// Re-export types
export type {
  S3Config,
  Logger,
  UploadPart,
  CompleteMultipartUploadResult,
  ExistResponseCode,
  ListBucketResponse,
  ListMultipartUploadResponse,
  ErrorWithCode,
} from './types.js';
