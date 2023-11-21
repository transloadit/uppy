import type { BasePlugin, PluginOptions, UppyFile } from '@uppy/core'

type MaybePromise<T> = T | Promise<T>

export type AwsS3UploadParameters =
  | {
      method: 'POST'
      url: string
      fields: Record<string, string>
      expires?: number
      headers?: Record<string, string>
    }
  | {
      method?: 'PUT'
      url: string
      fields?: Record<string, never>
      expires?: number
      headers?: Record<string, string>
    }

export interface AwsS3Part {
  PartNumber?: number
  Size?: number
  ETag?: string
}
/**
 * @deprecated use {@link AwsS3UploadParameters} instead
 */
export interface AwsS3SignedPart {
  url: string
  headers?: Record<string, string>
}
export interface AwsS3STSResponse {
  credentials: {
    AccessKeyId: string
    SecretAccessKey: string
    SessionToken: string
    Expiration?: string
  }
  bucket: string
  region: string
}

type AWSS3NonMultipartWithCompanionMandatory = {
  getUploadParameters?: never
}

type AWSS3NonMultipartWithoutCompanionMandatory = {
  getUploadParameters: (file: UppyFile) => MaybePromise<AwsS3UploadParameters>
}
type AWSS3NonMultipartWithCompanion = AWSS3WithCompanion &
  AWSS3NonMultipartWithCompanionMandatory & {
    shouldUseMultipart: false
    createMultipartUpload?: never
    listParts?: never
    signPart?: never
    abortMultipartUpload?: never
    completeMultipartUpload?: never
  }

type AWSS3NonMultipartWithoutCompanion = AWSS3WithoutCompanion &
  AWSS3NonMultipartWithoutCompanionMandatory & {
    shouldUseMultipart: false
    createMultipartUpload?: never
    listParts?: never
    signPart?: never
    abortMultipartUpload?: never
    completeMultipartUpload?: never
  }

type AWSS3MultipartWithoutCompanionMandatory = {
  getChunkSize?: (file: UppyFile) => number
  createMultipartUpload: (
    file: UppyFile,
  ) => MaybePromise<{ uploadId: string; key: string }>
  listParts: (
    file: UppyFile,
    opts: { uploadId: string; key: string; signal: AbortSignal },
  ) => MaybePromise<AwsS3Part[]>
  abortMultipartUpload: (
    file: UppyFile,
    opts: { uploadId: string; key: string; signal: AbortSignal },
  ) => MaybePromise<void>
  completeMultipartUpload: (
    file: UppyFile,
    opts: {
      uploadId: string
      key: string
      parts: AwsS3Part[]
      signal: AbortSignal
    },
  ) => MaybePromise<{ location?: string }>
} & (
  | {
      signPart: (
        file: UppyFile,
        opts: {
          uploadId: string
          key: string
          partNumber: number
          body: Blob
          signal: AbortSignal
        },
      ) => MaybePromise<AwsS3UploadParameters>
    }
  | {
      /** @deprecated Use signPart instead */
      prepareUploadParts: (
        file: UppyFile,
        partData: {
          uploadId: string
          key: string
          parts: [{ number: number; chunk: Blob }]
        },
      ) => MaybePromise<{
        presignedUrls: Record<number, string>
        headers?: Record<number, Record<string, string>>
      }>
    }
)
type AWSS3MultipartWithoutCompanion = AWSS3WithoutCompanion &
  AWSS3MultipartWithoutCompanionMandatory & {
    shouldUseMultipart?: true
    getUploadParameters?: never
  }

type AWSS3MultipartWithCompanion = AWSS3WithCompanion &
  Partial<AWSS3MultipartWithoutCompanionMandatory> & {
    shouldUseMultipart?: true
    getUploadParameters?: never
  }

type AWSS3MaybeMultipartWithCompanion = AWSS3WithCompanion &
  Partial<AWSS3MultipartWithoutCompanionMandatory> &
  AWSS3NonMultipartWithCompanionMandatory & {
    shouldUseMultipart: (file: UppyFile) => boolean
  }

type AWSS3MaybeMultipartWithoutCompanion = AWSS3WithoutCompanion &
  AWSS3MultipartWithoutCompanionMandatory &
  AWSS3NonMultipartWithoutCompanionMandatory & {
    shouldUseMultipart: (file: UppyFile) => boolean
  }

type AWSS3WithCompanion = {
  companionUrl: string
  companionHeaders?: Record<string, string>
  companionCookiesRule?: string
  getTemporarySecurityCredentials?: true
}
type AWSS3WithoutCompanion = {
  companionUrl?: never
  companionHeaders?: never
  companionCookiesRule?: never
  getTemporarySecurityCredentials?: (options?: {
    signal?: AbortSignal
  }) => MaybePromise<AwsS3STSResponse>
}

interface _AwsS3MultipartOptions extends PluginOptions {
  allowedMetaFields?: string[] | null
  limit?: number
  retryDelays?: number[] | null
}

export type AwsS3MultipartOptions = _AwsS3MultipartOptions &
  (
    | AWSS3NonMultipartWithCompanion
    | AWSS3NonMultipartWithoutCompanion
    | AWSS3MultipartWithCompanion
    | AWSS3MultipartWithoutCompanion
    | AWSS3MaybeMultipartWithCompanion
    | AWSS3MaybeMultipartWithoutCompanion
  )

declare class AwsS3Multipart extends BasePlugin<AwsS3MultipartOptions> {}

export default AwsS3Multipart
