import type { NextFunction, Request, Response } from 'express'
import { respondWithError } from '../provider/error.ts'

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

  try {
    const data = await provider.search({
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
