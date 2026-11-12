import type { Readable } from 'node:stream'
import { openProtectedStream, sizeFromHeaders } from './helpers/request.js'
import { HttpError } from './helpers/utils.js'
import logger from './logger.js'

/**
 * Downloads the content at the given URL.
 *
 * @param url - URL to download.
 * @param allowLocalIPs - Whether to allow local/private IPs (disables SSRF protection).
 * @param traceId - Request trace id for logging.
 */
export const downloadURL = async (
  url: string,
  allowLocalIPs: boolean,
  traceId?: string,
  options: Record<string, unknown> = {},
): Promise<{ stream: Readable; size: number | undefined }> => {
  try {
    const { stream, response } = await openProtectedStream(url, allowLocalIPs, {
      responseType: 'json',
      ...options,
    })
    // A 3xx reaches here only when there was no Location to follow: its body
    // is not the file either.
    if (response.statusCode >= 300) {
      // Drop the connection without reading the body: a hostile server can
      // inflate a few KB of gzip into gigabytes, and nothing here needs it.
      stream.destroy()
      throw new HttpError({
        statusCode: response.statusCode,
        responseJson: undefined,
      })
    }
    // Don't allow any more data to flow yet.
    stream.pause()
    return { stream, size: sizeFromHeaders(response.headers) }
  } catch (err) {
    logger.error(err, 'controller.url.download.error', traceId)
    throw err
  }
}
