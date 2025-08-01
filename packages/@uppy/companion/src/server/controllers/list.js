import { respondWithError } from '../provider/error.js'

export default async function list({ query, params, companion }, res, next) {
  const { providerUserSession } = companion

  try {
    const data = await companion.provider.list({
      companion,
      providerUserSession,
      directory: params.id,
      query,
    })
    res.json(data)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
