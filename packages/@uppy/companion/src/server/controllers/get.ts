import type { Request, Response } from 'express'
import { startDownUpload } from '../helpers/upload.ts'
import logger from '../logger.ts'
import { respondWithError } from '../provider/error.ts'

export default async function get(req: Request, res: Response): Promise<void> {
  const id = req.params['id']
  if (typeof id !== 'string' || id.length === 0) {
    res.sendStatus(400)
    return
  }
  const { providerUserSession } = req.companion
  const { provider } = req.companion
  if (!provider) {
    res.sendStatus(400)
    return
  }

  const getSize =
    typeof provider.size === 'function'
      ? async () => provider.size({ id, providerUserSession, query: req.query })
      : undefined

  const download = () =>
    provider.download({ id, providerUserSession, query: req.query })

  try {
    await startDownUpload({ req, res, getSize, download })
  } catch (err) {
    logger.error(err, 'controller.get.error', req.id)
    if (respondWithError(err, res)) return
    res.status(500).json({ message: 'Failed to download file' })
  }
}
