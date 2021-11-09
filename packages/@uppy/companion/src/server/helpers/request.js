const http = require('http')
const https = require('https')
const { URL } = require('url')
const dns = require('dns')
const ipAddress = require('ip-address')
const request = require('request')
const logger = require('../logger')

const FORBIDDEN_IP_ADDRESS = 'Forbidden IP address'

function isIPAddress (address) {
  const addressAsV6 = new ipAddress.Address6(address)
  const addressAsV4 = new ipAddress.Address4(address)
  return addressAsV6.isValid() || addressAsV4.isValid()
}

/* eslint-disable max-len */
/**
 * Determine if a IP address provided is a private one.
 * Return TRUE if it's the case, FALSE otherwise.
 * Excerpt from:
 * https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html#case-2---application-can-send-requests-to-any-external-ip-address-or-domain-name
 *
 * @param {string} ipAddress the ip address to validate
 * @returns {boolean}
 */
/* eslint-enable max-len */
function isPrivateIP (ipAddress) {
  let isPrivate = false
  // Build the list of IP prefix for V4 and V6 addresses
  const ipPrefix = []
  // Add prefix for loopback addresses
  ipPrefix.push('127.')
  ipPrefix.push('0.')
  // Add IP V4 prefix for private addresses
  // See https://en.wikipedia.org/wiki/Private_network
  ipPrefix.push('10.')
  ipPrefix.push('172.16.')
  ipPrefix.push('172.17.')
  ipPrefix.push('172.18.')
  ipPrefix.push('172.19.')
  ipPrefix.push('172.20.')
  ipPrefix.push('172.21.')
  ipPrefix.push('172.22.')
  ipPrefix.push('172.23.')
  ipPrefix.push('172.24.')
  ipPrefix.push('172.25.')
  ipPrefix.push('172.26.')
  ipPrefix.push('172.27.')
  ipPrefix.push('172.28.')
  ipPrefix.push('172.29.')
  ipPrefix.push('172.30.')
  ipPrefix.push('172.31.')
  ipPrefix.push('192.168.')
  ipPrefix.push('169.254.')
  // Add IP V6 prefix for private addresses
  // See https://en.wikipedia.org/wiki/Unique_local_address
  // See https://en.wikipedia.org/wiki/Private_network
  // See https://simpledns.com/private-ipv6
  ipPrefix.push('fc')
  ipPrefix.push('fd')
  ipPrefix.push('fe')
  ipPrefix.push('ff')
  ipPrefix.push('::1')
  // Verify the provided IP address
  // Remove whitespace characters from the beginning/end of the string
  // and convert it to lower case
  // Lower case is for preventing any IPV6 case bypass using mixed case
  // depending on the source used to get the IP address
  const ipToVerify = ipAddress.trim().toLowerCase()
  // Perform the check against the list of prefix
  for (const prefix of ipPrefix) {
    if (ipToVerify.startsWith(prefix)) {
      isPrivate = true
      break
    }
  }

  return isPrivate
}

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
      if (isPrivateIP(record.address)) {
        callback(new Error(FORBIDDEN_IP_ADDRESS), addresses, maybeFamily)
        return
      }
    }

    callback(err, addresses, maybeFamily)
  })
}

class HttpAgent extends http.Agent {
  createConnection (options, callback) {
    if (isIPAddress(options.host) && isPrivateIP(options.host)) {
      callback(new Error(FORBIDDEN_IP_ADDRESS))
      return undefined
    }
    // @ts-ignore
    return super.createConnection({ ...options, lookup: dnsLookup }, callback)
  }
}

class HttpsAgent extends https.Agent {
  createConnection (options, callback) {
    if (isIPAddress(options.host) && isPrivateIP(options.host)) {
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
exports.getURLMeta = (url, blockLocalIPs = false) => {
  return new Promise((resolve, reject) => {
    const opts = {
      uri: url,
      method: 'GET',
      followRedirect: exports.getRedirectEvaluator(url, blockLocalIPs),
      agentClass: exports.getProtectedHttpAgent((new URL(url)).protocol, blockLocalIPs),
    }

    const req = request(opts, (err) => {
      if (err) reject(err)
    })
    req.on('response', (response) => {
      if (response.statusCode >= 300) {
        // @todo possibly set a status code in the error object to get a more helpful
        // hint at what the cause of error is.
        reject(new Error(`URL server responded with status: ${response.statusCode}`))
      } else {
        req.abort() // No need to get the rest of the response, as we only want header

        // Can be undefined for unknown length URLs, e.g. transfer-encoding: chunked
        const contentLength = parseInt(response.headers['content-length'], 10)
        resolve({
          type: response.headers['content-type'],
          size: Number.isNaN(contentLength) ? null : contentLength,
        })
      }
    })
  })
}
