/**
 *
 * @param {object} req
 * @param {object} res
 */
async function thumbnail (req, res, next) {
  const { providerName } = req.params
  const { id } = req.params
  const token = req.companion.providerTokens[providerName]
  const { provider } = req.companion

  try {
    const response = await provider.thumbnail({ id, token })
    if (response) {
      response.pipe(res)
    } else {
      res.sendStatus(404)
    }
  } catch (err) {
    if (err.isAuthError) res.sendStatus(401)
    else next(err)
  }
}

module.exports = thumbnail
