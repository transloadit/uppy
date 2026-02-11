import { respondWithError } from '../provider/error.js'

export default async function search({ query, companion }, res, next) {
  const { providerUserSession } = companion

  try {
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
