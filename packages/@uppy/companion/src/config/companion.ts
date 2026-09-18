import fs from 'node:fs'
import type { PresignedPostOptions } from '@aws-sdk/s3-presigned-post'
import validator from 'validator'
import z from 'zod'
import type { CompanionInitOptions } from '../schemas/companion.js'
import { isRecord } from '../server/helpers/type-guards.js'
import { defaultGetKey } from '../server/helpers/utils.js'
import logger from '../server/logger.js'
import {
  parseS3ProviderOptions,
  parseTransloaditStorageProviderOptions,
} from '../server/provider/s3/config.js'
import { toKeyList } from '../server/provider/s3/grant.js'

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

/** A field holding one secret, or a list of them (grant signing secrets rotate). */
const SECRET_FIELDS = new Set(['secret', 'grantSecret'])

/**
 * Every secret under `value`, at any depth (`customProviders.*.config.secret`,
 * `workspaces.*.secret`, ...). Only plain objects are walked, each once: a
 * configured class instance (an SDK request handler, say) is not a place for
 * secrets, and neither it nor a self-referencing config may hang the startup.
 */
function collectSecrets(
  value: unknown,
  into: string[],
  seen = new WeakSet<object>(),
): void {
  if (!isRecord(value) || seen.has(value)) return
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) return
  seen.add(value)
  for (const [name, child] of Object.entries(value)) {
    if (SECRET_FIELDS.has(name)) {
      const list = typeof child === 'string' ? [child] : child
      if (Array.isArray(list)) {
        into.push(...toKeyList(list.filter((key) => typeof key === 'string')))
      }
    } else {
      collectSecrets(child, into, seen)
    }
  }
}

/**
 * Returns secrets that should be masked in log messages.
 */
export function getMaskableSecrets(
  companionOptions: CompanionInitOptions,
): string[] {
  const secrets: string[] = []
  const { customProviders, providerOptions, s3 } = companionOptions ?? {}
  collectSecrets({ customProviders, providerOptions, s3 }, secrets)
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

    if (providerOptions['s3'] != null) {
      parseS3ProviderOptions(providerOptions['s3'])
    }
    if (providerOptions['transloadit-storage'] != null) {
      parseTransloaditStorageProviderOptions(
        providerOptions['transloadit-storage'],
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
