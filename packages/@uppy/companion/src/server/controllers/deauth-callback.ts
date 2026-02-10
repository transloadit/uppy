import type { NextFunction, Request, Response } from 'express'
import { isRecord } from '../helpers/type-guards.js'
import { respondWithError } from '../provider/error.js'

export default async function deauthCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { body, companion, headers } = req
  const { provider } = companion
  if (!provider) {
    res.sendStatus(400)
    return
  }
  // we need the provider instance to decide status codes because
  // this endpoint does not cater to a uniform client.
  // It doesn't respond to Uppy client like other endpoints.
  // Instead it responds to the providers themselves.
  try {
    const out: unknown = await provider.deauthorizationCallback({
      companion,
      body,
      headers,
    })
    if (isRecord(out)) {
      const status = typeof out.status === 'number' ? out.status : 200
      res.status(status).json(out.data)
      return
    }
    res.json(out)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
