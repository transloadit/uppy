/**
 *
 * @param {object} req
 * @param {object} res
 */
function thumbnail (req, res, next) {
  const { providerName } = req.params
  const { id } = req.params
  const token = req.companion.providerTokens[providerName]
  const { provider } = req.companion

  provider.thumbnail({ id, token }, (err, response) => {
    if (err) {
      err.isAuthError ? res.sendStatus(401) : next(err)
      return
    }
    response ? response.pipe(res) : res.sendStatus(404)
  })
}

module.exports = thumbnail
