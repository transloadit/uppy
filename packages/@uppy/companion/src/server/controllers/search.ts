import withProvider from './with-provider.js'

export default withProvider(async (req, res, provider) => {
  const { query, companion } = req
  const buildURL = companion.buildURL
  const q = query['q']
  if (buildURL == null || typeof q !== 'string') {
    res.sendStatus(500)
    return
  }
  const data = await provider.search({
    companion: { buildURL },
    providerUserSession: companion.providerUserSession,
    query: { ...query, q },
  })
  res.json(data)
})
