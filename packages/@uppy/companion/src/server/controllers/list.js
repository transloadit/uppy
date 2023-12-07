const { respondWithError } = require('../provider/error')

async function list ({ query, params, companion }, res, next) {
  const { providerUserSession } = companion
  const { accessToken } = providerUserSession

  try {
    // todo remove backward compat `token` param from all provider methods (because it can be found in providerUserSession)
    const data = await companion.provider.list({
      companion, token: accessToken, providerUserSession, directory: params.id, query,
    })
    res.json(data)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}

module.exports = list
