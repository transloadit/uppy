import type { Readable as NodeReadableStream } from 'node:stream'
import type { Request, Response } from 'express'
import logger from '../logger.ts'
import Uploader from '../Uploader.ts'
import { isRecord } from './type-guards.ts'

export async function startDownUpload({
  req,
  res,
  getSize,
  download,
}: {
  req: Request
  res: Response
  getSize?: (() => Promise<unknown>) | undefined
  download: () => Promise<unknown>
}): Promise<void> {
  logger.debug('Starting download stream.', undefined, req.id)
  const downloadResult: unknown = await download()
  if (!isRecord(downloadResult)) {
    throw new TypeError('Invalid download result')
  }
  const stream = downloadResult['stream']
  const maybeSize = downloadResult['size']

  const isNodeReadableStream = (
    value: unknown,
  ): value is NodeReadableStream => {
    if (!value || (typeof value !== 'object' && typeof value !== 'function'))
      return false
    return (
      typeof Reflect.get(value, 'on') === 'function' &&
      typeof Reflect.get(value, 'pipe') === 'function'
    )
  }
  if (!isNodeReadableStream(stream)) {
    throw new TypeError('Invalid download stream')
  }

  let size: number | null | undefined
  // if we already know the size from the GET response content-length header, we can use that
  if (
    typeof maybeSize === 'number' &&
    !Number.isNaN(maybeSize) &&
    maybeSize > 0
  ) {
    size = maybeSize
  }
  // if not, we may need to explicitly get the size
  // note that getSize might also return undefined/null, which is usually fine, it just means that
  // the size is unknown and we cannot send the size to the Uploader
  if (size == null && getSize != null) {
    const maybeExplicitSize = await getSize()
    if (
      typeof maybeExplicitSize === 'number' &&
      !Number.isNaN(maybeExplicitSize) &&
      maybeExplicitSize > 0
    ) {
      size = maybeExplicitSize
    }
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
