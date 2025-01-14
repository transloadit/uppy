import { createAbortError } from '@uppy/utils/lib/AbortController'
import type { Body } from '@uppy/utils/lib/UppyFile'

import type { AwsS3Part } from './index.js'

export function throwIfAborted(signal?: AbortSignal | null): void {
  if (signal?.aborted) {
    throw createAbortError('The operation was aborted', {
      cause: signal.reason,
    })
  }
}

export type UploadResult = { key: string; uploadId?: string; bucket?: string }
export type UploadResultWithSignal = UploadResult & { signal?: AbortSignal }
export type MultipartUploadResult = UploadResult & { parts: AwsS3Part[] }
export type MultipartUploadResultWithSignal = MultipartUploadResult & {
  signal?: AbortSignal
}

export type UploadPartBytesResult = {
  ETag: string
  location?: string
}

export interface AwsBody extends Body {
  location: string
  key: string
  bucket: string
}
