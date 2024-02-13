const { respondWithError } = require('../provider/error')

/**
 *
 * @param {object} req
 * @param {object} res
 */
async function thumbnail (req, res, next) {
  const { id } = req.params
  const { provider, providerUserSession } = req.companion
  const { accessToken } = providerUserSession

  try {
    const { stream, contentType } = await provider.thumbnail({ id, token: accessToken, providerUserSession })
    if (contentType != null) res.set('Content-Type', contentType)
    stream.pipe(res)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}

module.exports = thumbnail
