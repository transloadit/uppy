const tokenService = require('../helpers/jwt')
const { respondWithError } = require('../provider/error')
const logger = require('../logger')

// https://www.dropboxforum.com/t5/Dropbox-API-Support-Feedback/Get-refresh-token-from-access-token/td-p/596739
// https://developers.dropbox.com/oauth-guide
// https://github.com/simov/grant/issues/149
async function refreshToken (req, res, next) {
  const { providerName } = req.params

  const { key: clientId, secret: clientSecret } = req.companion.options.providerOptions[providerName]

  const providerTokens = req.companion.allProvidersTokens[providerName]

  // not all providers have refresh tokens
  if (providerTokens.refreshToken == null) {
    res.sendStatus(401)
    return
  }

  try {
    const data = await req.companion.provider.refreshToken({
      clientId, clientSecret, refreshToken: providerTokens.refreshToken,
    })

    const newAllProvidersTokens = {
      ...req.companion.allProvidersTokens,
      [providerName]: {
        ...providerTokens,
        accessToken: data.accessToken,
      },
    }

    req.companion.allProvidersTokens = newAllProvidersTokens
    req.companion.providerTokens = newAllProvidersTokens[providerName]

    logger.debug(`Generating refreshed auth token for provider ${providerName}`, null, req.id)
    const uppyAuthToken = tokenService.generateEncryptedAuthToken(
      req.companion.allProvidersTokens, req.companion.options.secret,
    )

    tokenService.addToCookiesIfNeeded(req, res, uppyAuthToken)

    res.send({ uppyAuthToken })
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}

module.exports = refreshToken
