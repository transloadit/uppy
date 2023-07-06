/**
 *
 * @param {{ params: object, companion: object, query: object }} req
 * @param {object} res
 */
async function thumbnail ({ params, companion, query }, res, next) {
  const { providerName, id } = params
  const { accessToken } = companion.allProvidersTokens[providerName]
  const { provider } = companion

  try {
    const { stream } = await provider.thumbnail({ id, token: accessToken, query })
    stream.pipe(res)
  } catch (err) {
    if (err.isAuthError) res.sendStatus(401)
    else next(err)
  }
}

module.exports = thumbnail
