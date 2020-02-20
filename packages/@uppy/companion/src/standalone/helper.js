const fs = require('fs')
const merge = require('lodash.merge')
const stripIndent = require('common-tags/lib/stripIndent')
const utils = require('../server/helpers/utils')
const logger = require('../server/logger')
const crypto = require('crypto')
// @ts-ignore
const { version } = require('../../package.json')

/**
 * Reads all companion configuration set via environment variables
 * and via the config file path
 *
 * @returns {object}
 */
exports.getCompanionOptions = () => {
  return merge({}, getConfigFromEnv(), getConfigFromFile())
}

/**
 * Loads the config from environment variables
 *
 * @returns {object}
 */
const getConfigFromEnv = () => {
  const uploadUrls = process.env.COMPANION_UPLOAD_URLS
  const domains = process.env.COMPANION_DOMAINS || process.env.COMPANION_DOMAIN || null
  const validHosts = domains ? domains.split(',') : []

  return {
    providerOptions: {
      google: {
        key: process.env.COMPANION_GOOGLE_KEY,
        secret: getSecret('COMPANION_GOOGLE_SECRET')
      },
      dropbox: {
        key: process.env.COMPANION_DROPBOX_KEY,
        secret: getSecret('COMPANION_DROPBOX_SECRET')
      },
      instagram: {
        key: process.env.COMPANION_INSTAGRAM_KEY,
        secret: getSecret('COMPANION_INSTAGRAM_SECRET')
      },
      facebook: {
        key: process.env.COMPANION_FACEBOOK_KEY,
        secret: getSecret('COMPANION_FACEBOOK_SECRET')
      },
      microsoft: {
        key: process.env.COMPANION_ONEDRIVE_KEY,
        secret: getSecret('COMPANION_ONEDRIVE_SECRET')
      },
      s3: {
        key: process.env.COMPANION_AWS_KEY,
        secret: getSecret('COMPANION_AWS_SECRET'),
        bucket: process.env.COMPANION_AWS_BUCKET,
        endpoint: process.env.COMPANION_AWS_ENDPOINT,
        region: process.env.COMPANION_AWS_REGION,
        useAccelerateEndpoint:
          process.env.COMPANION_AWS_USE_ACCELERATE_ENDPOINT === 'true',
        expires: parseInt(process.env.COMPANION_AWS_EXPIRES || '300', 10)
      }
    },
    server: {
      host: process.env.COMPANION_DOMAIN,
      protocol: process.env.COMPANION_PROTOCOL,
      path: process.env.COMPANION_PATH,
      implicitPath: process.env.COMPANION_IMPLICIT_PATH,
      oauthDomain: process.env.COMPANION_OAUTH_DOMAIN,
      validHosts: validHosts
    },
    filePath: process.env.COMPANION_DATADIR,
    redisUrl: process.env.COMPANION_REDIS_URL,
    // adding redisOptions to keep all companion options easily visible
    //  redisOptions refers to https://www.npmjs.com/package/redis#options-object-properties
    redisOptions: {},
    sendSelfEndpoint: process.env.COMPANION_SELF_ENDPOINT,
    uploadUrls: uploadUrls ? uploadUrls.split(',') : null,
    secret: getSecret('COMPANION_SECRET') || generateSecret(),
    debug: process.env.NODE_ENV !== 'production',
    // TODO: this is a temporary hack to support distributed systems.
    // it is not documented, because it should be changed soon.
    cookieDomain: process.env.COMPANION_COOKIE_DOMAIN,
    multipleInstances: true
  }
}

/**
 * Tries to read the secret from a file if the according environment variable is set.
 * Otherwise it falls back to the standard secret environment variable.
 *
 * @param {string} baseEnvVar
 *
 * @returns {string}
 */
const getSecret = (baseEnvVar) => {
  return `${baseEnvVar}_FILE` in process.env
    ? fs.readFileSync(process.env[`${baseEnvVar}_FILE`]).toString()
    : process.env[baseEnvVar]
}

/**
 * Auto-generates server secret
 *
 * @returns {string}
 */
const generateSecret = () => {
  logger.warn('auto-generating server secret because none was specified', 'startup.secret')
  return crypto.randomBytes(64).toString('hex')
}

/**
 * Loads the config from a file and returns it as an object
 *
 * @returns {object}
 */
const getConfigFromFile = () => {
  const path = getConfigPath()
  if (!path) return {}

  const rawdata = fs.readFileSync(getConfigPath())
  // @ts-ignore
  return JSON.parse(rawdata)
}

/**
 * Returns the config path specified via cli arguments
 *
 * @returns {string}
 */
const getConfigPath = () => {
  let configPath

  for (let i = process.argv.length - 1; i >= 0; i--) {
    const isConfigFlag = process.argv[i] === '-c' || process.argv[i] === '--config'
    const flagHasValue = i + 1 <= process.argv.length
    if (isConfigFlag && flagHasValue) {
      configPath = process.argv[i + 1]
      break
    }
  }

  return configPath
}

/**
 * validates that the mandatory companion options are set.
 * If it is invalid, it will console an error of unset options and exits the process.
 * If it is valid, nothing happens.
 *
 * @param {object} config
 */
exports.validateConfig = (config) => {
  const mandatoryOptions = ['secret', 'filePath', 'server.host']
  /** @type {string[]} */
  const unspecified = []

  mandatoryOptions.forEach((i) => {
    const value = i.split('.').reduce((prev, curr) => prev[curr], config)

    if (!value) unspecified.push(`"${i}"`)
  })

  // vaidate that all required config is specified
  if (unspecified.length) {
    console.error('\x1b[31m', 'Please specify the following options',
      'to run companion as Standalone:\n', unspecified.join(',\n'), '\x1b[0m')
    process.exit(1)
  }

  // validate that specified filePath is writeable/readable.
  // TODO: consider moving this into the companion module itself.
  try {
    // @ts-ignore
    fs.accessSync(`${config.filePath}`, fs.R_OK | fs.W_OK)
  } catch (err) {
    console.error('\x1b[31m', `No access to "${config.filePath}".`,
      'Please ensure the directory exists and with read/write permissions.', '\x1b[0m')
    process.exit(1)
  }
}

/**
 *
 * @param {string} url
 */
exports.hasProtocol = (url) => {
  return url.startsWith('http://') || url.startsWith('https://')
}

exports.buildHelpfulStartupMessage = (companionOptions) => {
  const buildURL = utils.getURLBuilder(companionOptions)
  const callbackURLs = []
  Object.keys(companionOptions.providerOptions).forEach((providerName) => {
    // s3 does not need redirect_uris
    if (providerName === 's3') {
      return
    }

    callbackURLs.push(buildURL(`/connect/${providerName}/callback`, true))
  })

  return stripIndent`
    Welcome to Companion v${version}
    ===================================

    Congratulations on setting up Companion! Thanks for joining our cause, you have taken
    the first step towards the future of file uploading! We
    hope you are as excited about this as we are!

    While you did an awesome job on getting Companion running, this is just the welcome
    message, so let's talk about the places that really matter:

    - Be sure to add ${callbackURLs.join(', ')} as your Oauth redirect uris on their corresponding developer interfaces.
    - The URL ${buildURL('/metrics', true)} is available for  statistics to keep Companion running smoothly
    - https://github.com/transloadit/uppy/issues - report your bugs here

    So quit lollygagging, start uploading and experience the future!
  `
}
