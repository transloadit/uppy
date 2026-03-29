import type { NextFunction, Request, Response } from 'express'
import { respondWithError } from '../provider/error.js'

async function thumbnail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const id = req.params['id']
  if (id == null) {
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
    if (contentType != null) res.set('Content-Type', contentType)
    stream.pipe(res)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}

export default thumbnail
