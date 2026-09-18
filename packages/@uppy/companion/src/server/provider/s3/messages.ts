import { ProviderUserError } from '../error.js'

/**
 * The error codes the S3 providers send to the browser. Each is also a
 * `@uppy/core` locale key (`packages/@uppy/core/src/locale.ts` holds the
 * English text); a test checks that every code here exists there.
 *
 * TODO: share this list with the client packages (`@uppy/s3` mirrors it)
 * once the monorepo's tsconfig lets them import Companion's types.
 */
export const S3_USER_MESSAGE_KEYS = [
  's3AlreadyExists',
  's3Conflict',
  's3DestinationMustBeFile',
  's3FileTooLargeToMove',
  's3FolderIntoItself',
  's3FolderMoveNotSupported',
  's3FolderNotEmpty',
  's3InvalidGrant',
  's3InvalidName',
  's3NotConfigured',
  's3NotFound',
  's3OutsideAllowedFolder',
  's3ReadOnlySession',
  's3RequestFailed',
  's3SelectedInOtherSession',
] as const

export type S3UserMessageKey = (typeof S3_USER_MESSAGE_KEYS)[number]

/** A user-facing failure, reported by code; the browser translates it. */
export const s3UserError = (code: S3UserMessageKey): ProviderUserError =>
  new ProviderUserError({ code })
