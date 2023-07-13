/**
 *
 * @param {object} req
 * @param {object} res
 */
async function thumbnail (req, res, next) {
  const { providerName, id } = req.params
  const { accessToken } = req.companion.allProvidersTokens[providerName]
  const { provider } = req.companion

  try {
    const { stream } = await provider.thumbnail({ id, token: accessToken })
    stream.pipe(res)
  } catch (err) {
    if (err.isAuthError) res.sendStatus(401)
    else next(err)
  }
}

module.exports = thumbnail
