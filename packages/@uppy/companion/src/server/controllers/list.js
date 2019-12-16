function list ({ query, params, companion }, res, next) {
  const providerName = params.providerName
  const token = companion.providerTokens[providerName]

  companion.provider.list({ companion, token, directory: params.id, query }, (err, data) => {
    if (err) {
      return err.isAuthError ? res.sendStatus(401) : next(err)
    }
    return res.json(data)
  })
}

module.exports = list
