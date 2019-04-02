function list ({ query, params, uppy }, res, next) {
  const providerName = params.providerName
  const token = uppy.providerTokens[providerName]

  uppy.provider.list({ uppy, token, directory: params.id, query }, (err, data) => {
    if (err) {
      return err.isAuthError ? res.sendStatus(401) : next(err)
    }
    return res.json(data)
  })
}

module.exports = list
