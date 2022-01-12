// eslint-disable-next-line max-classes-per-file
const http = require('http')
const https = require('https')
const { URL } = require('url')
const dns = require('dns')
const request = require('request')
const ipaddr = require('ipaddr.js')

const logger = require('../logger')

const FORBIDDEN_IP_ADDRESS = 'Forbidden IP address'

// Example scary IPs that should return false (ipv6-to-ipv4 mapped):
// ::FFFF:127.0.0.1
// ::ffff:7f00:1
const isDisallowedIP = (ipAddress) => ipaddr.parse(ipAddress).range() !== 'unicast'

module.exports.FORBIDDEN_IP_ADDRESS = FORBIDDEN_IP_ADDRESS

module.exports.getRedirectEvaluator = (rawRequestURL, blockPrivateIPs) => {
  const requestURL = new URL(rawRequestURL)
  return (res) => {
    if (!blockPrivateIPs) {
      return true
    }

    let redirectURL = null
    try {
      redirectURL = new URL(res.headers.location, requestURL)
    } catch (err) {
      return false
    }

    const shouldRedirect = redirectURL.protocol === requestURL.protocol
    if (!shouldRedirect) {
      logger.info(
        `blocking redirect from ${requestURL} to ${redirectURL}`, 'redirect.protection',
      )
    }

    return shouldRedirect
  }
}

function dnsLookup (hostname, options, callback) {
  dns.lookup(hostname, options, (err, addresses, maybeFamily) => {
    if (err) {
      callback(err, addresses, maybeFamily)
      return
    }

    const toValidate = Array.isArray(addresses) ? addresses : [{ address: addresses }]
    for (const record of toValidate) {
      if (isDisallowedIP(record.address)) {
        callback(new Error(FORBIDDEN_IP_ADDRESS), addresses, maybeFamily)
        return
      }
    }

    callback(err, addresses, maybeFamily)
  })
}

class HttpAgent extends http.Agent {
  createConnection (options, callback) {
    if (ipaddr.isValid(options.host) && isDisallowedIP(options.host)) {
      callback(new Error(FORBIDDEN_IP_ADDRESS))
      return undefined
    }
    // @ts-ignore
    return super.createConnection({ ...options, lookup: dnsLookup }, callback)
  }
}

class HttpsAgent extends https.Agent {
  createConnection (options, callback) {
    if (ipaddr.isValid(options.host) && isDisallowedIP(options.host)) {
      callback(new Error(FORBIDDEN_IP_ADDRESS))
      return undefined
    }
    // @ts-ignore
    return super.createConnection({ ...options, lookup: dnsLookup }, callback)
  }
}

/**
 * Returns http Agent that will prevent requests to private IPs (to preven SSRF)
 *
 * @param {string} protocol http or http: or https: or https protocol needed for the request
 * @param {boolean} blockPrivateIPs if set to false, this protection will be disabled
 */
module.exports.getProtectedHttpAgent = (protocol, blockPrivateIPs) => {
  if (blockPrivateIPs) {
    return protocol.startsWith('https') ? HttpsAgent : HttpAgent
  }

  return protocol.startsWith('https') ? https.Agent : http.Agent
}

/**
 * Gets the size and content type of a url's content
 *
 * @param {string} url
 * @param {boolean} blockLocalIPs
 * @returns {Promise<{type: string, size: number}>}
 */
exports.getURLMeta = async (url, blockLocalIPs = false) => {
  const requestWithMethod = async (method) => new Promise((resolve, reject) => {
    const opts = {
      uri: url,
      method,
      followRedirect: exports.getRedirectEvaluator(url, blockLocalIPs),
      agentClass: exports.getProtectedHttpAgent((new URL(url)).protocol, blockLocalIPs),
    }

    const req = request(opts, (err) => {
      if (err) reject(err)
    })
    req.on('response', (response) => {
      // Can be undefined for unknown length URLs, e.g. transfer-encoding: chunked
      const contentLength = parseInt(response.headers['content-length'], 10)

      // No need to get the rest of the response, as we only want header (not really relevant for HEAD, but why not)
      req.abort()

      resolve({
        type: response.headers['content-type'],
        size: Number.isNaN(contentLength) ? null : contentLength,
        statusCode: response.statusCode,
      })
    })
  })

  // We prefer to use a HEAD request, as it doesn't download the content. If the URL doesn't
  // support HEAD, or doesn't follow the spec and provide the correct Content-Length, we
  // fallback to GET.
  let urlMeta = await requestWithMethod('HEAD')

  // If HTTP error response, we retry with GET, which may work on non-compliant servers
  // (e.g. HEAD doesn't work on signed S3 URLs)
  // We look for status codes in the 400 and 500 ranges here, as 3xx errors are
  // unlikely to have to do with our choice of method
  if (urlMeta.statusCode >= 400 || urlMeta.size === 0 || urlMeta.size == null) {
    urlMeta = await requestWithMethod('GET')
  }

  if (urlMeta.statusCode >= 300) {
    // @todo possibly set a status code in the error object to get a more helpful
    // hint at what the cause of error is.
    throw new Error(`URL server responded with status: ${urlMeta.statusCode}`)
  }

  const { size, type } = urlMeta
  return { size, type }
}
