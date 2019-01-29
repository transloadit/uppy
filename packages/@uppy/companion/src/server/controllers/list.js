function list ({ query, params, uppy }, res, next) {
  const providerName = params.providerName
  const token = uppy.providerTokens[providerName]

  uppy.provider.list({ uppy, token, directory: params.id, query }, (err, data) => {
    return err ? next(err) : res.json(data)
  })
}

module.exports = list
