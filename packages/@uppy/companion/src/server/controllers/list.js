const { respondWithError } = require('../provider/error')

/**
 *
 * @param {{ query: object, params: object, companion: object }} req
 * @param {object} res
 */
async function list ({ query, params, companion }, res, next) {
  const { accessToken } = companion.providerTokens

  try {
    const data = await companion.provider.list({ companion, token: accessToken, directory: params.id, query })
    res.json(data)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}

module.exports = list
