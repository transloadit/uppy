/**
 *
 * @param {object} req
 * @param {object} res
 */
function thumbnail (req, res) {
  const providerName = req.params.providerName
  const id = req.params.id
  const token = req.uppy.providerTokens[providerName]
  const provider = req.uppy.provider

  provider.thumbnail({ id, token }, (response) => response ? response.pipe(res) : res.sendStatus(404))
}

module.exports = thumbnail
