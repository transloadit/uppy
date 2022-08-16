/**
 *
 * @param {object} req
 * @param {object} res
 */
async function thumbnail (req, res, next) {
  const { providerName, id } = req.params
  const token = req.companion.providerTokens[providerName]
  const { provider } = req.companion

  try {
    const { stream } = await provider.thumbnail({ id, token })
    stream.pipe(res)
  } catch (err) {
    if (err.isAuthError) res.sendStatus(401)
    else next(err)
  }
}

module.exports = thumbnail
