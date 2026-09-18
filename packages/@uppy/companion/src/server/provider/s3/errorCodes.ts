import { ProviderUserError } from '../error.js'

/**
 * The error codes the S3 providers send to the browser. `@uppy/core` maps
 * each to the locale string describing it (`companion-client/errorCodes.ts`);
 * a test checks that every code here is known there.
 *
 * TODO: share this list with the client packages (`@uppy/core` mirrors it)
 * once the monorepo's tsconfig lets them import Companion's types.
 */
export const S3_ERROR_CODES = [
  'S3_ALREADY_EXISTS',
  'S3_CONFLICT',
  'S3_DESTINATION_MUST_BE_FILE',
  'S3_FILE_TOO_LARGE_TO_MOVE',
  'S3_FOLDER_INTO_ITSELF',
  'S3_FOLDER_MOVE_NOT_SUPPORTED',
  'S3_FOLDER_NOT_EMPTY',
  'S3_INVALID_GRANT',
  'S3_INVALID_NAME',
  'S3_NOT_CONFIGURED',
  'S3_NOT_FOUND',
  'S3_OUTSIDE_ALLOWED_FOLDER',
  'S3_READ_ONLY_SESSION',
  'S3_REQUEST_FAILED',
  'S3_SELECTED_IN_OTHER_SESSION',
] as const

export type S3ErrorCode = (typeof S3_ERROR_CODES)[number]

/** A user-facing failure, reported by code; the browser translates it. */
export const s3UserError = (code: S3ErrorCode): ProviderUserError =>
  new ProviderUserError({ code })
