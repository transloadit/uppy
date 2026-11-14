import type { Readable } from 'node:stream'
import type { Request, Response } from 'express'
import type { Promisable } from 'type-fest'
import logger from '../logger.js'
import Uploader from '../Uploader.js'
import { toError } from './type-guards.js'

export async function startDownUpload({
  req,
  res,
  getSize,
  download,
}: {
  req: Request
  res: Response
  getSize?: (() => Promisable<number | null | undefined>) | undefined
  download: () => Promisable<{ stream: Readable; size: number | undefined }>
}): Promise<void> {
  logger.debug('Starting download stream.', undefined, req.id)
  const { stream, size: maybeSize } = await download()
  // The stream sits idle until the client's progress socket connects, and a
  // Readable that emits 'error' with no listener is an uncaught exception. Keep
  // one attached for its whole life; Uploader checks `destroyed` when it starts.
  // Message only: a got error object carries the request headers.
  stream.on('error', (err) => {
    logger.warn(
      `download stream error: ${toError(err).message}`,
      'controller.download.stream.error',
      req.id,
    )
  })

  // if we already know the size from the GET response content-length header, we can use that
  let size: number | null | undefined =
    maybeSize != null && !Number.isNaN(maybeSize) && maybeSize > 0
      ? maybeSize
      : undefined

  // download() opened the stream before the Uploader validated the request.
  // Anything thrown from here on (a refused destination, a size lookup error)
  // must destroy the stream, or its socket and decompressor leak until restart.
  let uploader: Uploader
  try {
    // if not, we may need to explicitly get the size
    // note that getSize might also return undefined/null, which is usually fine, it just means that
    // the size is unknown and we cannot send the size to the Uploader
    if (size == null && getSize != null) {
      size = await getSize()
    }

    logger.debug('Instantiating uploader.', undefined, req.id)
    uploader = new Uploader(Uploader.reqToOptions(req, size ?? undefined))
  } catch (err) {
    stream.destroy()
    throw err
  }

  const { clientSocketConnectTimeout } = req.companion.options

  // "Forking" off the upload operation to background, so we can return the http request:
  ;(async () => {
    try {
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
    } catch (err) {
      // e.g. the client's socket never connected within the timeout. The
      // stream was never handed to tryUploadStream, so destroy it and remove
      // the emitter listeners the Uploader registered (both would otherwise
      // leak until the process restarts).
      if (!stream.destroyed) stream.destroy()
      uploader.removeEmitterListeners()
      throw err
    }
  })().catch((err) => logger.error(err))

  // Respond the request
  // NOTE: the Uploader will continue running after the http request is responded
  res.status(200).json({ token: uploader.token })
}
