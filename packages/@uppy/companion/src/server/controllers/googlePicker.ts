import type { Request, Response, Router } from 'express'
import express from 'express'
import { z } from 'zod'
import { downloadURL } from '../download.js'
import { validateURL } from '../helpers/request.js'
import { startDownUpload } from '../helpers/upload.js'
import logger from '../logger.js'
import { respondWithError } from '../provider/error.js'
import { streamGoogleFile } from '../provider/google/drive/index.js'

const getAuthHeader = (token: string): { authorization: string } => ({
  authorization: `Bearer ${token}`,
})

const googlePickerBodySchema = z.discriminatedUnion('platform', [
  z.object({
    platform: z.literal('drive'),
    accessToken: z.string().min(1),
    fileId: z.string().min(1),
  }),
  z.object({
    platform: z.literal('photos'),
    accessToken: z.string().min(1),
    url: z.string().min(1),
  }),
])

const get = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug('Google Picker file import handler running', null, req.id)

    const allowLocalUrls = false

    const parsedBody = googlePickerBodySchema.safeParse(req.body)
    if (!parsedBody.success) {
      res.status(400).json({ error: 'Invalid request body' })
      return
    }
    const { accessToken, platform } = parsedBody.data

    if (
      platform === 'photos' &&
      !validateURL(parsedBody.data.url, allowLocalUrls)
    ) {
      res.status(400).json({ error: 'Invalid URL' })
      return
    }

    const download = () => {
      if (platform === 'drive') {
        return streamGoogleFile({
          token: accessToken,
          id: parsedBody.data.fileId,
        })
      }
      return downloadURL(parsedBody.data.url, allowLocalUrls, req.id, {
        headers: getAuthHeader(accessToken),
      })
    }

    await startDownUpload({ req, res, download, getSize: undefined })
  } catch (err) {
    logger.error(err, 'controller.googlePicker.error', req.id)
    if (respondWithError(err, res)) return
    res.status(500).json({ message: 'failed to fetch Google Picker URL' })
  }
}

export default (): Router => express.Router().post('/get', express.json(), get)
