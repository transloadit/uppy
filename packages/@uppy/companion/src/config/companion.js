const ms = require('ms')
const fs = require('fs')
const { isURL } = require('validator')
const logger = require('../server/logger')

const defaultOptions = {
  server: {
    protocol: 'http',
    path: '',
  },
  providerOptions: {},
  s3: {
    acl: 'public-read', // todo default to no ACL in next major
    endpoint: 'https://{service}.{region}.amazonaws.com',
    conditions: [],
    useAccelerateEndpoint: false,
    getKey: (req, filename) => filename,
    expires: ms('5 minutes') / 1000,
  },
  allowLocalUrls: false,
  logClientVersion: true,
  periodicPingUrls: [],
  streamingUpload: false,
  clientSocketConnectTimeout: 60000,
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

  const { providerOptions, periodicPingUrls } = companionOptions

  if (providerOptions) {
    const deprecatedOptions = { microsoft: 'onedrive', google: 'drive' }
    Object.keys(deprecatedOptions).forEach((deprected) => {
      if (providerOptions[deprected]) {
        throw new Error(`The Provider option "${deprected}" is no longer supported. Please use the option "${deprecatedOptions[deprected]}" instead.`)
      }
    })
  }

  if (companionOptions.uploadUrls == null || companionOptions.uploadUrls.length === 0) {
    logger.warn('Running without uploadUrls specified is a security risk if running in production', 'startup.uploadUrls')
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
