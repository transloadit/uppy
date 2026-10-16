import withProvider from './with-provider.js'

export default withProvider(async (req, res, provider) => {
  const { query, params, companion } = req
  const id = params['id']
  if (typeof id !== 'string' && id != null) {
    res.sendStatus(400)
    return
  }
  const data = await provider.list({
    companion,
    providerUserSession: companion.providerUserSession,
    directory: id,
    query,
  })
  res.json(data)
})
