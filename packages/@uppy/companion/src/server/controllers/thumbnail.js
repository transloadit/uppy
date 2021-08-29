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
      if (err.isAuthError) res.sendStatus(401)
      else next(err)
    } else if (response) {
      response.pipe(res)
    } else {
      res.sendStatus(404)
    }
  })
}

module.exports = thumbnail
