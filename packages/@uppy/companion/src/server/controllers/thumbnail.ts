import type { NextFunction, Request, Response } from 'express'
import { isRecord } from '../helpers/type-guards.ts'
import { respondWithError } from '../provider/error.ts'

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
    const out: unknown = await provider.thumbnail({
      id,
      providerUserSession,
    })
    if (!isRecord(out)) {
      throw new Error('Invalid thumbnail response')
    }
    const stream = out['stream']
    const contentType = out['contentType']
    const pipe =
      stream != null &&
      (typeof stream === 'object' || typeof stream === 'function')
        ? Reflect.get(stream, 'pipe')
        : undefined
    if (typeof pipe !== 'function') {
      throw new Error('Invalid thumbnail stream')
    }
    if (typeof contentType === 'string') res.set('Content-Type', contentType)
    pipe.call(stream, res)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}

export default thumbnail
