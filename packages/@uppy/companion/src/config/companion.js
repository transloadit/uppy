const fs = require('node:fs')
const { isURL } = require('validator')
const logger = require('../server/logger')
const { defaultGetKey } = require('../server/helpers/utils')

const defaultOptions = {
  server: {
    protocol: 'http',
    path: '',
  },
  providerOptions: {},
  s3: {
    endpoint: 'https://{service}.{region}.amazonaws.com',
    conditions: [],
    useAccelerateEndpoint: false,
    getKey: defaultGetKey,
    expires: 800, // seconds
  },
  enableUrlEndpoint: true, // todo next major make this default false
  allowLocalUrls: false,
  periodicPingUrls: [],
  streamingUpload: false,
  clientSocketConnectTimeout: 60000,
  metrics: true,
}

/**
 * @param {object} companionOptions
 */
function getMaskableSecrets (companionOptions) {
  const secrets = []
  const { providerOptions, customProviders, s3 } = companionOptions

  Object.keys(providerOptions).forEach((provider) => {
    if (providerOptions[provider].secret) {
      secrets.push(providerOptions[provider].secret)
    }
  })

  if (customProviders) {
    Object.keys(customProviders).forEach((provider) => {
      if (customProviders[provider].config && customProviders[provider].config.secret) {
        secrets.push(customProviders[provider].config.secret)
      }
    })
  }

  if (s3?.secret) {
    secrets.push(s3.secret)
  }

  return secrets
}

/**
 * validates that the mandatory companion options are set.
 * If it is invalid, it will console an error of unset options and exits the process.
 * If it is valid, nothing happens.
 *
 * @param {object} companionOptions
 */
const validateConfig = (companionOptions) => {
  const mandatoryOptions = ['secret', 'filePath', 'server.host']
  /** @type {string[]} */
  const unspecified = []

  mandatoryOptions.forEach((i) => {
    const value = i.split('.').reduce((prev, curr) => (prev ? prev[curr] : undefined), companionOptions)

    if (!value) unspecified.push(`"${i}"`)
  })

  // vaidate that all required config is specified
  if (unspecified.length) {
    const messagePrefix = 'Please specify the following options to use companion:'
    throw new Error(`${messagePrefix}\n${unspecified.join(',\n')}`)
  }

  // validate that specified filePath is writeable/readable.
  try {
    // @ts-ignore
    fs.accessSync(`${companionOptions.filePath}`, fs.R_OK | fs.W_OK) // eslint-disable-line no-bitwise
  } catch (err) {
    throw new Error(
      `No access to "${companionOptions.filePath}". Please ensure the directory exists and with read/write permissions.`,
    )
  }

  const { providerOptions, periodicPingUrls, server } = companionOptions

  if (server && server.path) {
    // see https://github.com/transloadit/uppy/issues/4271
    // todo fix the code so we can allow `/`
    if (server.path === '/') throw new Error('If you want to use \'/\' as server.path, leave the \'path\' variable unset')
  }

  if (providerOptions) {
    const deprecatedOptions = { microsoft: 'providerOptions.onedrive', google: 'providerOptions.drive', s3: 's3' }
    Object.keys(deprecatedOptions).forEach((deprecated) => {
      if (Object.prototype.hasOwnProperty.call(providerOptions, deprecated)) {
        throw new Error(`The Provider option "providerOptions.${deprecated}" is no longer supported. Please use the option "${deprecatedOptions[deprecated]}" instead.`)
      }
    })
  }

  if (companionOptions.uploadUrls == null || companionOptions.uploadUrls.length === 0) {
    if (process.env.NODE_ENV === 'production') throw new Error('uploadUrls is required')
    logger.error('Running without uploadUrls is a security risk and Companion will refuse to start up when running in production (NODE_ENV=production)', 'startup.uploadUrls')
  }

  if (periodicPingUrls != null && (
    !Array.isArray(periodicPingUrls)
    || periodicPingUrls.some((url2) => !isURL(url2, { protocols: ['http', 'https'], require_protocol: true, require_tld: false }))
  )) {
    throw new TypeError('Invalid periodicPingUrls')
  }
}

module.exports = {
  defaultOptions,
  getMaskableSecrets,
  validateConfig,
}
