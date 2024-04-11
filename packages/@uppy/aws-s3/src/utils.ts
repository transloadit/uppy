import { createAbortError } from '@uppy/utils/lib/AbortController'
import type { Body as _Body } from '@uppy/utils/lib/UppyFile'

import type { AwsS3Part } from './index'

export function throwIfAborted(signal?: AbortSignal | null): void {
  if (signal?.aborted) {
    throw createAbortError('The operation was aborted', {
      cause: signal.reason,
    })
  }
}

export type UploadResult = { key: string; uploadId: string }
export type UploadResultWithSignal = UploadResult & { signal?: AbortSignal }
export type MultipartUploadResult = UploadResult & { parts: AwsS3Part[] }
export type MultipartUploadResultWithSignal = MultipartUploadResult & {
  signal?: AbortSignal
}

export type UploadPartBytesResult = {
  ETag: string
  location?: string
}

export interface Body extends _Body {
  location: string
}
