import type { NextFunction, Request, Response } from 'express'
import { respondWithError } from '../provider/error.ts'

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
    const { data, status } = await provider.deauthorizationCallback({
      companion,
      body,
      headers,
    })
    res.status(status ?? 200).json(data)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}
