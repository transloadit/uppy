import type { S3Client } from '@aws-sdk/client-s3'
import type { createPresignedPost } from '@aws-sdk/s3-presigned-post'

export type CompanionContext = {
  options: Record<string, unknown>
  provider?: unknown
  providerName?: string
  providerClass?: {
    oauthProvider?: unknown
    hasSimpleAuth?: unknown
    authStateExpiry?: number
  }
  providerGrantConfig?: Record<string, unknown>
  providerUserSession?: unknown
  authToken?: unknown
  buildURL?: (
    subPath: string,
    isExternal: boolean,
    excludeHost?: boolean,
  ) => string
  s3Client?: S3Client
  s3ClientCreatePresignedPost?:
    | ReturnType<typeof createPresignedPost>
    | S3Client
  getProviderCredentials?: unknown
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Request {
      companion: CompanionContext
      id?: string
      cookies?: Record<string, string>
      session?: unknown
    }
  }
}
