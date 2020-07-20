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

  if (!req.companion.providerTokens) {
    req.companion.providerTokens = {}
  }

  const grant = req.session.grant || {}
  if (grant.response && grant.response.access_token) {
    req.companion.providerTokens[providerName] = grant.response.access_token
    logger.debug(`Generating auth token for provider ${providerName}`, null, req.id)
    const uppyAuthToken = tokenService.generateToken(req.companion.providerTokens, req.companion.options.secret)
    return res.redirect(req.companion.buildURL(`/${providerName}/send-token?uppyAuthToken=${uppyAuthToken}`, true))
  }

  logger.debug(`Did not receive access token for provider ${providerName}`, null, req.id)
  logger.debug(grant.response, 'callback.oauth.resp', req.id)
  return res.sendStatus(400)
}
