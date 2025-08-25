import * as tokenService from '../helpers/jwt.js'
import logger from '../logger.js'
import { respondWithError } from '../provider/error.js'

// https://www.dropboxforum.com/t5/Dropbox-API-Support-Feedback/Get-refresh-token-from-access-token/td-p/596739
// https://developers.dropbox.com/oauth-guide
// https://github.com/simov/grant/issues/149
export default async function refreshToken(req, res, next) {
  const { providerName } = req.params

  const { key: clientId, secret: clientSecret } = req.companion.options
    .providerOptions[providerName] ?? { __proto__: null }
  const { redirect_uri: redirectUri } = req.companion.providerGrantConfig

  const { providerUserSession } = req.companion

  // not all providers have refresh tokens
  if (
    providerUserSession.refreshToken == null ||
    providerUserSession.refreshToken === ''
  ) {
    logger.warn('Tried to refresh token without having a token')
    res.sendStatus(401)
    return
  }

  try {
    const data = await req.companion.provider.refreshToken({
      redirectUri,
      clientId,
      clientSecret,
      refreshToken: providerUserSession.refreshToken,
    })

    req.companion.providerUserSession = {
      ...providerUserSession,
      accessToken: data.accessToken,
    }

    logger.debug(
      `Generating refreshed auth token for provider ${providerName}`,
      null,
      req.id,
    )
    const uppyAuthToken = tokenService.generateEncryptedAuthToken(
      { [providerName]: req.companion.providerUserSession },
      req.companion.options.secret,
      req.companion.providerClass.authStateExpiry,
    )

    tokenService.addToCookiesIfNeeded(
      req,
      res,
      uppyAuthToken,
      req.companion.providerClass.authStateExpiry,
    )

    res.send({ uppyAuthToken })
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
