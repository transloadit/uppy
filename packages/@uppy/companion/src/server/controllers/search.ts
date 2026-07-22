import type { NextFunction, Request, Response } from 'express'
import { respondWithError } from '../provider/error.js'

export default async function search(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { query, companion } = req
  const { providerUserSession, provider } = companion
  if (!provider) {
    res.sendStatus(400)
    return
  }

  const buildURL = companion.buildURL
  const q = query['q']
  if (buildURL == null || typeof q !== 'string') {
    res.sendStatus(500)
    return
  }

  try {
    const data = await provider.search({
      companion: { buildURL },
      providerUserSession,
      query: { ...query, q },
    })
    res.json(data)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
