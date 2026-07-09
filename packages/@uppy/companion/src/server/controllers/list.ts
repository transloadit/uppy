import type { NextFunction, Request, Response } from 'express'
import { respondWithError } from '../provider/error.js'

export default async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { query, params, companion } = req
  const id = params['id']
  const { providerUserSession, provider } = companion
  if (!provider || (typeof id !== 'string' && id != null)) {
    res.sendStatus(400)
    return
  }

  try {
    const data = await provider.list({
      companion,
      providerUserSession,
      directory: id,
      query,
    })
    res.json(data)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
