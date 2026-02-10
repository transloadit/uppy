import fs from 'node:fs'
import validator from 'validator'
import { isRecord } from '../server/helpers/type-guards.ts'
import { defaultGetKey } from '../server/helpers/utils.ts'
import logger from '../server/logger.ts'

type ProviderOption = {
  key?: string
  secret?: string
  credentialsURL?: string
} & Record<string, unknown>

type CustomProvider = {
  config?: { secret?: string } & Record<string, unknown>
} & Record<string, unknown>

type CompanionServer = {
  protocol?: string
  host?: string
  path?: string
} & Record<string, unknown>

export type CompanionOptions = {
  secret?: string
  filePath?: string
  server?: CompanionServer
  providerOptions?: Record<string, ProviderOption>
  customProviders?: Record<string, CustomProvider>
  s3?: { secret?: string } & Record<string, unknown>
  uploadUrls?: { length: number } | null
  corsOrigins?: unknown
  periodicPingUrls?: string[]
  maxFilenameLength?: number
} & Record<string, unknown>

const defaultS3Conditions: unknown[] = []
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
} satisfies CompanionOptions

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null
  return value
}

/**
 * Returns secrets that should be masked in log messages.
 */
export function getMaskableSecrets(companionOptions: unknown): string[] {
  const secrets: string[] = []
  const root = asRecord(companionOptions) ?? {}
  const providerOptions = asRecord(root.providerOptions) ?? {}
  const customProviders = asRecord(root.customProviders)
  const s3 = asRecord(root.s3)

  Object.keys(providerOptions).forEach((provider) => {
    const entry = asRecord(providerOptions[provider])
    const secret = entry?.secret
    if (typeof secret === 'string' && secret.length > 0) secrets.push(secret)
  })

  if (customProviders) {
    Object.keys(customProviders).forEach((provider) => {
      const entry = asRecord(customProviders[provider])
      const config = asRecord(entry?.config)
      const secret = config?.secret
      if (typeof secret === 'string' && secret.length > 0) secrets.push(secret)
    })
  }

  const s3Secret = s3?.secret
  if (typeof s3Secret === 'string' && s3Secret.length > 0) {
    secrets.push(s3Secret)
  }

  return secrets
}

/**
 * Validates that the mandatory Companion options are set.
 *
 * If invalid, throws with an error explaining what needs to be fixed.
 */
export function validateConfig(companionOptions: unknown): void {
  const mandatoryOptions = ['secret', 'filePath', 'server.host']
  const unspecified: string[] = []

  function getNested(obj: unknown, parts: string[]): unknown {
    let cur: unknown = obj
    for (const part of parts) {
      if (isRecord(cur) && Object.hasOwn(cur, part)) {
        cur = cur[part]
        continue
      }
      return undefined
    }
    return cur
  }

  mandatoryOptions.forEach((i) => {
    const value = getNested(companionOptions, i.split('.'))

    if (!value) unspecified.push(`"${i}"`)
  })

  if (unspecified.length) {
    const messagePrefix =
      'Please specify the following options to use companion:'
    throw new Error(`${messagePrefix}\n${unspecified.join(',\n')}`)
  }

  const filePath = `${getNested(companionOptions, ['filePath'])}`

  // validate that specified filePath is writeable/readable.
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK)
  } catch {
    throw new Error(
      `No access to "${filePath}". Please ensure the directory exists and with read/write permissions.`,
    )
  }

  const providerOptions = getNested(companionOptions, ['providerOptions'])
  const periodicPingUrls = getNested(companionOptions, ['periodicPingUrls'])
  const server = getNested(companionOptions, ['server'])

  if (server && typeof server === 'object' && 'path' in server) {
    // see https://github.com/transloadit/uppy/issues/4271
    // todo fix the code so we can allow `/`
    if ((server as { path?: unknown }).path === '/') {
      throw new Error(
        "If you want to use '/' as server.path, leave the 'path' variable unset",
      )
    }
  }

  if (providerOptions && typeof providerOptions === 'object') {
    const deprecatedOptions: Record<string, string> = {
      microsoft: 'providerOptions.onedrive',
      google: 'providerOptions.drive',
      s3: 's3',
    }
    Object.keys(deprecatedOptions).forEach((deprecated) => {
      if (Object.hasOwn(providerOptions as object, deprecated)) {
        throw new Error(
          `The Provider option "providerOptions.${deprecated}" is no longer supported. Please use the option "${deprecatedOptions[deprecated]}" instead.`,
        )
      }
    })
  }

  const uploadUrls = getNested(companionOptions, ['uploadUrls']) as
    | { length?: unknown }
    | null
    | undefined

  if (uploadUrls == null || uploadUrls.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('uploadUrls is required')
    }
    logger.error(
      'Running without uploadUrls is a security risk and Companion will refuse to start up when running in production (NODE_ENV=production)',
      'startup.uploadUrls',
    )
  }

  const corsOrigins = getNested(companionOptions, ['corsOrigins'])
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

  if (
    periodicPingUrls != null &&
    (!Array.isArray(periodicPingUrls) ||
      periodicPingUrls.some(
        (url2) =>
          !validator.isURL(url2, {
            protocols: ['http', 'https'],
            require_protocol: true,
            require_tld: false,
          }),
      ))
  ) {
    throw new TypeError('Invalid periodicPingUrls')
  }

  const maxFilenameLengthRaw = getNested(companionOptions, [
    'maxFilenameLength',
  ])
  if (maxFilenameLengthRaw !== undefined && Number(maxFilenameLengthRaw) <= 0) {
    throw new TypeError('Option maxFilenameLength must be greater than 0')
  }
}
