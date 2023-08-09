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
    const { stream } = await provider.thumbnail({ id, token: accessToken, providerUserSession })
    res.set('Content-Type', 'image/jpeg')
    stream.pipe(res)
  } catch (err) {
    if (err.isAuthError) res.sendStatus(401)
    else next(err)
  }
}

module.exports = thumbnail
