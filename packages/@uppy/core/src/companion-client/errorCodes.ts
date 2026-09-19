import type locale from '../locale.js'

type LocaleKey = keyof (typeof locale)['strings']

/**
 * The error codes Companion reports (`{ code }` in a 400 body), each mapped to
 * the locale string that describes it to the user.
 *
 * TODO: derive the codes from `@uppy/companion` (`ProviderErrorCode`) instead of
 * mirroring them, once the monorepo's tsconfig lets client packages import
 * its types.
 */
export const companionErrorLocaleKeys = {
  S3_ALREADY_EXISTS: 's3AlreadyExists',
  S3_CONFLICT: 's3Conflict',
  S3_DESTINATION_MUST_BE_FILE: 's3DestinationMustBeFile',
  S3_FILE_TOO_LARGE_TO_MOVE: 's3FileTooLargeToMove',
  S3_FOLDER_INTO_ITSELF: 's3FolderIntoItself',
  S3_FOLDER_MOVE_NOT_SUPPORTED: 's3FolderMoveNotSupported',
  S3_FOLDER_NOT_EMPTY: 's3FolderNotEmpty',
  S3_INVALID_GRANT: 's3InvalidGrant',
  S3_INVALID_NAME: 's3InvalidName',
  S3_NOT_CONFIGURED: 's3NotConfigured',
  S3_NOT_FOUND: 's3NotFound',
  S3_OUTSIDE_ALLOWED_FOLDER: 's3OutsideAllowedFolder',
  S3_READ_ONLY_SESSION: 's3ReadOnlySession',
  S3_REQUEST_FAILED: 's3RequestFailed',
  S3_SELECTED_IN_OTHER_SESSION: 's3SelectedInOtherSession',
  WEBDAV_CANNOT_CONNECT: 'webdavCannotConnect',
} as const satisfies Record<string, LocaleKey>

export type CompanionErrorCode = keyof typeof companionErrorLocaleKeys

/**
 * What to show the user for a `UserFacingApiError`: the code's locale string
 * when this version knows the code, the verbatim `message` otherwise, and the
 * generic Companion failure when there is only a code it does not know
 * (the request client puts the code in `message` then).
 */
export function describeCompanionError(
  i18n: (key: string) => string,
  error: { code?: string | undefined; message: string },
): string {
  const localeKey = error.code
    ? localeKeyForCompanionError(error.code)
    : undefined
  if (localeKey) return i18n(localeKey)
  if (error.code && error.message === error.code) return i18n('companionError')
  return error.message
}

/** The locale key for `code`, or `undefined` for a code this version does not know. */
export function localeKeyForCompanionError(
  code: string,
): LocaleKey | undefined {
  return Object.hasOwn(companionErrorLocaleKeys, code)
    ? companionErrorLocaleKeys[code as CompanionErrorCode]
    : undefined
}
