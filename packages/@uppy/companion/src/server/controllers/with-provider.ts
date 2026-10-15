import type { NextFunction, Request, Response } from 'express'
import { respondWithError } from '../provider/error.js'
import type Provider from '../provider/Provider.js'

/**
 * Wraps a controller that needs the request's provider: answers 400 when there
 * is none, and turns errors into responses with `respondWithError` (or passes
 * them on to Express).
 */
export default function withProvider(
  handler: (req: Request, res: Response, provider: Provider) => Promise<void>,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { provider } = req.companion
    if (!provider) {
      res.sendStatus(400)
      return
    }
    try {
      await handler(req, res, provider)
    } catch (err) {
      if (respondWithError(err, res)) return
      next(err)
    }
  }
}
