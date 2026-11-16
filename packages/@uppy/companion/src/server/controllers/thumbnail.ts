import { pipeline } from 'node:stream/promises'
import type { NextFunction, Request, Response } from 'express'
import { respondWithError } from '../provider/error.js'

async function thumbnail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const id = req.params['id']
  if (typeof id !== 'string' || id.length === 0) {
    res.sendStatus(400)
    return
  }
  const { provider, providerUserSession } = req.companion
  if (!provider) {
    res.sendStatus(400)
    return
  }

  try {
    const { stream, contentType } = await provider.thumbnail({
      id,
      providerUserSession,
    })
    try {
      // The browser can leave while thumbnail() is still awaiting headers.
      if (res.destroyed) return
      if (contentType != null) res.set('Content-Type', contentType)
      await pipeline(stream, res)
    } finally {
      stream.destroy()
    }
  } catch (err) {
    if (res.headersSent || res.destroyed) return
    if (respondWithError(err, res)) return
    next(err)
  }
}

export default thumbnail
