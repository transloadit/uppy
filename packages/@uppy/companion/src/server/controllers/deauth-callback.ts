import withProvider from './with-provider.js'

// we need the provider instance to decide status codes because
// this endpoint does not cater to a uniform client.
// It doesn't respond to Uppy client like other endpoints.
// Instead it responds to the providers themselves.
export default withProvider(async (req, res, provider) => {
  const { body, companion, headers } = req
  const { data, status } = await provider.deauthorizationCallback({
    companion,
    body,
    headers,
  })
  res.status(status ?? 200).json(data)
})
