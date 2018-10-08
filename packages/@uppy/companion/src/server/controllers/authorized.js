// TODO: this function seems uneccessary. Might be better to just
// have this as a middleware that is used for all auth required routes.

const logger = require('../logger')

/**
 * checks if companion is authorized to access a user's provider account.
 *
 * @param {object} req
 * @param {object} res
 */
function authorized (req, res) {
  const { params, uppy } = req
  const providerName = params.providerName

  if (!uppy.providerTokens || !uppy.providerTokens[providerName]) {
    return res.json({ authenticated: false })
  }

  const token = uppy.providerTokens[providerName]
  uppy.provider.list({ token, uppy }, (err, response, body) => {
    const notAuthenticated = Boolean(err)
    if (notAuthenticated) {
      logger.debug(`${providerName} failed authorizarion test err:${err}`, 'provider.auth.check')
    }
    return res.json({ authenticated: !notAuthenticated })
  })
}

module.exports = authorized
