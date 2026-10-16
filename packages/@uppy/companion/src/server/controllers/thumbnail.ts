import withProvider from './with-provider.js'

export default withProvider(async (req, res, provider) => {
  const id = req.params['id']
  if (typeof id !== 'string' || id.length === 0) {
    res.sendStatus(400)
    return
  }
  const { stream, contentType } = await provider.thumbnail({
    id,
    providerUserSession: req.companion.providerUserSession,
  })
  if (contentType != null) res.set('Content-Type', contentType)
  stream.pipe(res)
})
