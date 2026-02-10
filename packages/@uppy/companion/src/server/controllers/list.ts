import type { NextFunction, Request, Response } from 'express'
import { respondWithError } from '../provider/error.ts'

export default async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { query, params, companion } = req
  const { providerUserSession, provider } = companion
  if (!provider) {
    res.sendStatus(400)
    return
  }

  try {
    const data = await provider.list({
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
