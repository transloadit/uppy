import type { Readable } from 'node:stream'
import type { Request, Response } from 'express'
import logger from '../logger.ts'
import Uploader from '../Uploader.ts'

export async function startDownUpload({
  req,
  res,
  getSize,
  download,
}: {
  req: Request
  res: Response
  getSize?: (() => Promise<number | null | undefined>) | undefined
  download: () => Promise<{ stream: Readable; size: number | undefined }>
}): Promise<void> {
  logger.debug('Starting download stream.', undefined, req.id)
  const { stream, size: maybeSize } = await download()

  // if we already know the size from the GET response content-length header, we can use that
  let size: number | null | undefined =
    maybeSize != null && !Number.isNaN(maybeSize) && maybeSize > 0
      ? maybeSize
      : undefined

  // if not, we may need to explicitly get the size
  // note that getSize might also return undefined/null, which is usually fine, it just means that
  // the size is unknown and we cannot send the size to the Uploader
  if (size == null && getSize != null) {
    size = await getSize()
  }
  const { clientSocketConnectTimeout } = req.companion.options

  logger.debug('Instantiating uploader.', undefined, req.id)
  const uploader = new Uploader(Uploader.reqToOptions(req, size ?? undefined))

  // "Forking" off the upload operation to background, so we can return the http request:
  ;(async () => {
    // wait till the client has connected to the socket, before starting
    // the download, so that the client can receive all download/upload progress.
    logger.debug(
      'Waiting for socket connection before beginning remote download/upload.',
      undefined,
      req.id,
    )
    await uploader.awaitReady(clientSocketConnectTimeout)
    logger.debug(
      'Socket connection received. Starting remote download/upload.',
      undefined,
      req.id,
    )

    await uploader.tryUploadStream(stream, req)
  })().catch((err) => logger.error(err))

  // Respond the request
  // NOTE: the Uploader will continue running after the http request is responded
  res.status(200).json({ token: uploader.token })
}
