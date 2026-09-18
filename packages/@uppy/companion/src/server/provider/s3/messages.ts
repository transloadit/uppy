import { ProviderUserError } from '../error.js'

/**
 * The messages the S3 providers send to the browser, as `@uppy/core` locale
 * keys (`packages/@uppy/core/src/locale.ts` holds the English text). A test
 * checks that every key here exists there.
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

/** A user-facing failure the browser translates and shows as is. */
export const s3UserError = (i18nKey: S3UserMessageKey): ProviderUserError =>
  new ProviderUserError({ i18nKey })
