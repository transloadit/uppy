function list ({ query, params, uppy }, res, next) {
  const providerName = params.providerName
  const token = uppy.providerTokens[providerName]

  uppy.provider.list({ token, directory: params.id, query }, (err, resp, body) => {
    if (err) {
      return next(err)
    }
    return res.json(body)
  })
}

module.exports = list
