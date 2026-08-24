import fs from 'node:fs'
import type { PresignedPostOptions } from '@aws-sdk/s3-presigned-post'
import validator from 'validator'
import z from 'zod'
import type { CompanionInitOptions } from '../schemas/companion.js'
import { defaultGetKey, regexMetaCharacters } from '../server/helpers/utils.js'
import logger from '../server/logger.js'

const defaultS3Conditions: PresignedPostOptions['Conditions'] = []
const defaultPeriodicPingUrls: string[] = []

export const defaultOptions = {
  server: {
    protocol: 'http',
    path: '',
  },
  providerOptions: {},
  s3: {
    endpoint: 'https://{service}.{region}.amazonaws.com',
    conditions: defaultS3Conditions,
    useAccelerateEndpoint: false,
    getKey: defaultGetKey,
    expires: 800, // seconds
  },
  enableUrlEndpoint: false,
  enableGooglePickerEndpoint: false,
  allowLocalUrls: false,
  periodicPingUrls: defaultPeriodicPingUrls,
  streamingUpload: true,
  clientSocketConnectTimeout: 60000,
  metrics: true,
}

/**
 * Returns secrets that should be masked in log messages.
 */
export function getMaskableSecrets(
  companionOptions: CompanionInitOptions,
): string[] {
  const secrets: string[] = []
  const { customProviders, providerOptions = {}, s3 } = companionOptions ?? {}

  Object.keys(providerOptions).forEach((provider) => {
    const secret = providerOptions[provider]?.secret
    if (secret != null) secrets.push(secret)
  })

  if (customProviders) {
    Object.keys(customProviders).forEach((provider) => {
      const secret = customProviders[provider]?.config?.secret
      if (secret != null) secrets.push(secret)
    })
  }

  const s3Secret = s3?.['secret']
  if (s3Secret != null) {
    secrets.push(s3Secret)
  }

  return secrets
}

const validateConfigSchema = z.object({
  filePath: z.string().nonempty(),
  secret: z.string().nonempty(),
  server: z.object({
    host: z.string().nonempty(),
  }),
  periodicPingUrls: z
    .string()
    .refine(
      (url) =>
        validator.isURL(url, {
          protocols: ['http', 'https'],
          require_protocol: true,
          require_tld: false,
        }),
      {
        message: 'periodicPingUrls',
      },
    )
    .array()
    .optional(),
  maxFilenameLength: z.number().positive().optional(),
})

/**
 * Validates the `uploadUrls` allowlist.
 *
 * String entries are matched literally (same origin, path boundary), so an
 * entry written as a regular expression would silently never match. Catch that
 * at startup rather than at the first upload.
 */
function validateUploadUrls(
  uploadUrls: CompanionInitOptions['uploadUrls'],
): void {
  for (const entry of uploadUrls ?? []) {
    if (entry instanceof RegExp) {
      if (!entry.source.startsWith('^')) {
        logger.warn(
          `uploadUrls entry ${entry} is not anchored, so it also matches URLs that merely contain it. Anchor it with "^" and terminate it at a path boundary, e.g. /^https:\\/\\/example\\.com\\//`,
          'startup.uploadUrls',
        )
      }
      continue
    }

    let url: URL
    try {
      url = new URL(entry)
    } catch {
      throw new Error(
        `uploadUrls entry "${entry}" is not an absolute URL. Include the scheme, e.g. "https://example.com/files/".`,
      )
    }

    // A literal URL never contains a backslash, and a hostname never contains
    // regex metacharacters -- both mean the entry was written as a pattern.
    // Note that `$`, `(` and `)` are legal in a path, so we only look at the
    // hostname for those.
    if (entry.includes('\\') || regexMetaCharacters.test(url.hostname)) {
      throw new Error(
        `uploadUrls entry "${entry}" looks like a regular expression. String entries are matched literally and are no longer compiled into regular expressions -- list the URLs explicitly, or pass a RegExp when configuring Companion programmatically.`,
      )
    }

    if (url.search || url.hash) {
      logger.warn(
        `uploadUrls entry "${entry}" has a query or fragment, which is ignored when matching. Only the origin and path are compared.`,
        'startup.uploadUrls',
      )
    }
  }
}

/**
 * Validates the `server.validHosts` allowlist, which is matched exactly.
 */
function validateValidHosts(validHosts: string[] | undefined): void {
  for (const host of validHosts ?? []) {
    if (regexMetaCharacters.test(host)) {
      throw new Error(
        `server.validHosts entry "${host}" looks like a regular expression. Entries are matched exactly and are no longer compiled into regular expressions -- list the hosts explicitly, or pass a RegExp when configuring Companion programmatically.`,
      )
    }
  }
}

/**
 * Validates that the mandatory Companion options are set.
 *
 * If invalid, throws with an error explaining what needs to be fixed.
 */
export function validateConfig(companionOptions: CompanionInitOptions): void {
  const parsedConfig = validateConfigSchema.parse(companionOptions)
  const { filePath } = parsedConfig

  // validate that specified filePath is writeable/readable.
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK)
  } catch {
    throw new Error(
      `No access to "${filePath}". Please ensure the directory exists and with read/write permissions.`,
    )
  }

  const { providerOptions, server, uploadUrls } = companionOptions

  // see https://github.com/transloadit/uppy/issues/4271
  // todo fix the code so we can allow `/`
  if (server.path === '/') {
    throw new Error(
      "If you want to use '/' as server.path, leave the 'path' variable unset",
    )
  }

  if (providerOptions) {
    const deprecatedOptions: Record<string, string> = {
      microsoft: 'providerOptions.onedrive',
      google: 'providerOptions.drive',
      s3: 's3',
    }
    Object.keys(deprecatedOptions).forEach((deprecated) => {
      if (Object.hasOwn(providerOptions, deprecated)) {
        throw new Error(
          `The Provider option "providerOptions.${deprecated}" is no longer supported. Please use the option "${deprecatedOptions[deprecated]}" instead.`,
        )
      }
    })
  }

  if (uploadUrls == null || uploadUrls.length === 0) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('uploadUrls is required')
    }
    logger.error(
      'Running without uploadUrls is a security risk and Companion will refuse to start up when running in production (NODE_ENV=production)',
      'startup.uploadUrls',
    )
  }

  validateUploadUrls(uploadUrls)
  validateValidHosts(server.validHosts)

  const { corsOrigins } = companionOptions
  if (corsOrigins == null) {
    throw new TypeError(
      'Option corsOrigins is required. To disable security, pass true',
    )
  }

  if (corsOrigins === '*') {
    throw new TypeError(
      'Option corsOrigins cannot be "*". To disable security, pass true',
    )
  }
}
