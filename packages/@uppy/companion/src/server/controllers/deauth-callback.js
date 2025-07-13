import { respondWithError } from '../provider/error.js'

export default async function deauthCallback(
  { body, companion, headers },
  res,
  next,
) {
  // we need the provider instance to decide status codes because
  // this endpoint does not cater to a uniform client.
  // It doesn't respond to Uppy client like other endpoints.
  // Instead it responds to the providers themselves.
  try {
    const { data, status } = await companion.provider.deauthorizationCallback({
      companion,
      body,
      headers,
    })
    res.status(status || 200).json(data)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
