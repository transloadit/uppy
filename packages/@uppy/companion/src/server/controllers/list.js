const { errorToResponse } = require('../provider/error')

function list ({ query, params, companion }, res, next) {
  const providerName = params.providerName
  const token = companion.providerTokens[providerName]

  companion.provider.list({ companion, token, directory: params.id, query }, (err, data) => {
    if (err) {
      const errResp = errorToResponse(err)
      if (errResp) {
        return res.status(errResp.code).json({ message: errResp.message })
      }
      return next(err)
    }
    return res.json(data)
  })
}

module.exports = list
