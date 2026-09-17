import fs from 'node:fs'
import type { PresignedPostOptions } from '@aws-sdk/s3-presigned-post'
import validator from 'validator'
import z from 'zod'
import type {
  CompanionInitOptions,
  S3ProviderOptions,
} from '../schemas/companion.js'
import { defaultGetKey } from '../server/helpers/utils.js'
import logger from '../server/logger.js'
import { hasGrantKeys, toKeyList } from '../server/provider/s3/grant.js'

const defaultS3Conditions: PresignedPostOptions['Conditions'] = []
const defaultPeriodicPingUrls: string[] = []

export const defaultOptions = {
  server: {
    protocol: 'http',
    path: '',
  },
  // Typed rather than left as `{}`: the runtime options are this object
  // intersected with `CompanionInitOptions`, and a bare `{}` erases what
  // `providerOptions.s3` is (`S3ProviderOptions`) for everything reading it.
  providerOptions: {} as NonNullable<CompanionInitOptions['providerOptions']>,
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
 * Fields of a provider's options that hold a secret. A field may hold a single
 * secret or a list of them (the S3 provider's grant signing secrets rotate),
 * so every value goes through `toKeyList`.
 */
const SECRET_FIELDS = ['secret', 'grantSecret'] as const

type SecretFields = Partial<
  Record<(typeof SECRET_FIELDS)[number], string | string[]>
>

/**
 * Returns secrets that should be masked in log messages.
 */
export function getMaskableSecrets(
  companionOptions: CompanionInitOptions,
): string[] {
  const secrets: string[] = []
  const { customProviders, providerOptions = {}, s3 } = companionOptions ?? {}

  for (const providerOption of Object.values(providerOptions)) {
    const fields = providerOption as SecretFields | undefined
    for (const field of SECRET_FIELDS) {
      secrets.push(...toKeyList(fields?.[field]))
    }
  }

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
 * Patterns are matched as written, so one that is not anchored also matches a
 * value that merely *contains* it -- the shape of
 * https://github.com/transloadit/uppy/issues/6480. It can be deliberate, so
 * this warns rather than refuses.
 */
function warnIfUnanchored(pattern: RegExp, option: string): void {
  if (pattern.source.startsWith('^')) return
  logger.warn(
    `${option} entry ${pattern} is not anchored, so it also matches values that merely contain it. Start it with "^".`,
    `startup.${option}`,
  )
}

/**
 * Validates the `uploadUrls` allowlist: only what is unambiguously broken.
 * https://uppy.io/docs/companion/#uploadurls covers migrating an entry that
 * used to be compiled as a regex, and the mistakes that make a pattern too
 * permissive.
 */
function validateUploadUrls(
  uploadUrls: CompanionInitOptions['uploadUrls'],
): void {
  for (const entry of uploadUrls ?? []) {
    if (entry instanceof RegExp) {
      warnIfUnanchored(entry, 'uploadUrls')
      continue
    }

    let url: URL
    try {
      url = new URL(entry)
    } catch (cause) {
      throw new Error(
        `uploadUrls entry "${entry}" is not an absolute URL. Include the scheme, e.g. "https://example.com/files/".`,
        { cause },
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

function validateValidHosts(
  validHosts: NonNullable<CompanionInitOptions['server']>['validHosts'],
): void {
  for (const entry of validHosts ?? []) {
    if (entry instanceof RegExp) warnIfUnanchored(entry, 'validHosts')
  }
}

const keyList = z.union([z.string(), z.array(z.string())]).optional()

/**
 * The two modes of the S3 provider are exclusive: either `bucket` (with an
 * optional `prefix`) names the one bucket everybody browses, or a grant key
 * makes each grant name its own bucket and prefix. Setting both is a mistake
 * (typically a development bucket left next to production grant keys), and
 * setting neither leaves the provider unable to serve anything; both are
 * refused at startup rather than logged.
 */
const s3ProviderOptionsSchema = z
  .object({
    bucket: z.string().min(1).optional(),
    prefix: z.string().optional(),
    grantSecret: keyList,
    grantPublicKey: keyList,
  })
  .superRefine((s3, ctx) => {
    const hasGrantKey = hasGrantKeys({
      secrets: s3.grantSecret,
      publicKeys: s3.grantPublicKey,
    })
    if (hasGrantKey && (s3.bucket != null || s3.prefix != null)) {
      ctx.addIssue({
        code: 'custom',
        path: [s3.bucket != null ? 'bucket' : 'prefix'],
        message:
          'cannot be combined with a grant key (`grantSecret` / `grantPublicKey`): each grant names the bucket and prefix it allows',
      })
    } else if (!hasGrantKey && s3.bucket == null) {
      ctx.addIssue({
        code: 'custom',
        message:
          'set either `bucket` (single-tenant) or a grant key (`grantSecret` / `grantPublicKey`, multi-tenant)',
      })
    }
  })

function validateS3Provider(
  s3Provider: S3ProviderOptions | undefined | null,
): void {
  if (s3Provider == null) return
  const result = s3ProviderOptionsSchema.safeParse(s3Provider)
  if (!result.success) {
    throw new Error(
      `Invalid providerOptions.s3: ${z.prettifyError(result.error)}`,
    )
  }
}

/**
 * Fields that only ever configured *uploads*, so finding one under
 * `providerOptions.s3` means the config predates the S3 provider. `awsSse` and
 * the other credential/connection settings are shared by both, so they are not
 * listed here.
 */
const UPLOAD_ONLY_S3_FIELDS = [
  'getKey',
  'conditions',
  'expires',
  'useAccelerateEndpoint',
] as const

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
    }
    Object.keys(deprecatedOptions).forEach((deprecated) => {
      if (Object.hasOwn(providerOptions, deprecated)) {
        throw new Error(
          `The Provider option "providerOptions.${deprecated}" is no longer supported. Please use the option "${deprecatedOptions[deprecated]}" instead.`,
        )
      }
    })

    // `providerOptions.s3` is *not* deprecated: it configures the S3 provider
    // (browsing a bucket), which is a different feature from the top-level
    // `s3` block (uploading to a bucket). It used to be where the upload
    // settings lived, though, so an upload-only field there is the old config.
    const uploadOnlyField = UPLOAD_ONLY_S3_FIELDS.find((field) =>
      Object.hasOwn(providerOptions['s3'] ?? {}, field),
    )
    if (uploadOnlyField != null) {
      throw new Error(
        `The Provider option "providerOptions.s3.${uploadOnlyField}" is no longer supported. Please use the option "s3.${uploadOnlyField}" instead: the upload settings belong in the top-level "s3" block, while "providerOptions.s3" now configures the S3 provider.`,
      )
    }
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
  validateS3Provider(providerOptions?.['s3'])

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
