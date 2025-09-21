import { respondWithError } from '../provider/error.js'

export default async function search({ query, companion }, res, next) {
  const { providerUserSession } = companion

  try {
    if (typeof companion.provider.search !== 'function') {
      throw new Error('Search is not supported by this provider')
    }

    const data = await companion.provider.search({
      companion,
      providerUserSession,
      query,
    })
    res.json(data)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
