const fs = require('fs')
const merge = require('lodash.merge')
const stripIndent = require('common-tags/lib/stripIndent')
const utils = require('../server/helpers/utils')
const logger = require('../server/logger')
const crypto = require('crypto')
// @ts-ignore
const { version } = require('../../package.json')

/**
 * Reads all service-dog configuration set via environment variables
 * and via the config file path
 *
 * @returns {object}
 */
exports.getUppyOptions = () => {
  return merge({}, getConfigFromEnv(), getConfigFromFile())
}

/**
 * Loads the config from environment variables
 *
 * @returns {object}
 */
const getConfigFromEnv = () => {
  const uploadUrls = process.env.UPPYSERVER_UPLOAD_URLS
  const domains = process.env.UPPYSERVER_DOMAINS || process.env.UPPYSERVER_DOMAIN || null
  const validHosts = domains ? domains.split(',') : []

  return {
    // TODO: Rename providerOptions to providers.
    providerOptions: {
      google: {
        key: process.env.UPPYSERVER_GOOGLE_KEY,
        secret: process.env.UPPYSERVER_GOOGLE_SECRET
      },
      dropbox: {
        key: process.env.UPPYSERVER_DROPBOX_KEY,
        secret: process.env.UPPYSERVER_DROPBOX_SECRET
      },
      instagram: {
        key: process.env.UPPYSERVER_INSTAGRAM_KEY,
        secret: process.env.UPPYSERVER_INSTAGRAM_SECRET
      },
      s3: {
        key: process.env.UPPYSERVER_AWS_KEY,
        secret: process.env.UPPYSERVER_AWS_SECRET,
        bucket: process.env.UPPYSERVER_AWS_BUCKET,
        endpoint: process.env.UPPYSERVER_AWS_ENDPOINT,
        region: process.env.UPPYSERVER_AWS_REGION
      }
    },
    server: {
      host: process.env.UPPYSERVER_DOMAIN,
      protocol: process.env.UPPYSERVER_PROTOCOL,
      path: process.env.UPPYSERVER_PATH,
      implicitPath: process.env.UPPYSERVER_IMPLICIT_PATH,
      oauthDomain: process.env.UPPYSERVER_OAUTH_DOMAIN,
      validHosts: validHosts
    },
    filePath: process.env.UPPYSERVER_DATADIR,
    redisUrl: process.env.UPPYSERVER_REDIS_URL,
    sendSelfEndpoint: process.env.UPPYSERVER_SELF_ENDPOINT,
    uploadUrls: uploadUrls ? uploadUrls.split(',') : null,
    secret: process.env.UPPYSERVER_SECRET || generateSecret(),
    debug: process.env.NODE_ENV !== 'production',
    // TODO: this is a temporary hack to support distributed systems.
    // it is not documented, because it should be changed soon.
    cookieDomain: process.env.UPPYSERVER_COOKIE_DOMAIN,
    multipleInstances: true
  }
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
  // TODO validate the json object fields to match the uppy config schema
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
 * validates that the mandatory service-dog options are set.
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
      'to run service-dog as Standalone:\n', unspecified.join(',\n'), '\x1b[0m')
    process.exit(1)
  }

  // validate that specified filePath is writeable/readable.
  // TODO: consider moving this into the uppy module itself.
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

exports.buildHelpfulStartupMessage = (uppyOptions) => {
  const buildURL = utils.getURLBuilder(uppyOptions)
  const callbackURLs = []
  Object.keys(uppyOptions.providerOptions).forEach((providerName) => {
    // s3 does not need redirect_uris
    if (providerName === 's3') {
      return
    }

    if (providerName === 'google') {
      providerName = 'drive'
    }

    callbackURLs.push(buildURL(`/${providerName}/callback`, true))
  })

  return stripIndent`
    Welcome to Uppy Server v${version}
    ===================================

    Congratulations on setting up Uppy Server! Thanks for joining our cause, you have taken
    the first step towards the future of file uploading! We
    hope you are as excited about this as we are!

    While you did an awesome job on getting Uppy Server running, this is just the welcome
    message, so let's talk about the places that really matter:

    - Be sure to add ${callbackURLs.join(', ')} as your Oauth redirect uris on their corresponding developer interfaces.
    - The URL ${buildURL('/metrics', true)} is available for  statistics to keep Uppy Server running smoothly
    - https://github.com/transloadit/uppy/issues - report your bugs here

    So quit lollygagging, start uploading and experience the future!
  `
}
