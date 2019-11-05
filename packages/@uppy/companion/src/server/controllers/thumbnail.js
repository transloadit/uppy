/**
 *
 * @param {object} req
 * @param {object} res
 */
function thumbnail (req, res, next) {
  const providerName = req.params.providerName
  const id = req.params.id
  const token = req.companion.providerTokens[providerName]
  const provider = req.companion.provider

  provider.thumbnail({ id, token }, (err, response) => {
    if (err) {
      err.isAuthError ? res.sendStatus(401) : next(err)
    }
    response ? response.pipe(res) : res.sendStatus(404)
  })
}

module.exports = thumbnail
