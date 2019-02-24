/**
 * oAuth callback.  Encrypts the access token and sends the new token with the response,
 */
const tokenService = require('../helpers/jwt')
const logger = require('../logger')

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = function callback (req, res, next) {
  const providerName = req.params.providerName

  if (!req.uppy.providerTokens) {
    req.uppy.providerTokens = {}
  }

  // TODO see if the access_token can be transported in a different way that url query params
  req.uppy.providerTokens[providerName] = req.query.access_token
  logger.debug(`Generating auth token for provider ${providerName}.`)
  const uppyAuthToken = tokenService.generateToken(req.uppy.providerTokens, req.uppy.options.secret)
  return res.redirect(req.uppy.buildURL(`/${providerName}/send-token?uppyAuthToken=${uppyAuthToken}`, true))
}
