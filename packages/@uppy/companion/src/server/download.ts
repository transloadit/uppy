import { getProtectedGot } from './helpers/request.ts'
import { prepareStream } from './helpers/utils.ts'
import logger from './logger.ts'

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
): Promise<{ stream: unknown; size: number | undefined }> => {
  try {
    const protectedGot = getProtectedGot({ allowLocalIPs })
    const stream = protectedGot.stream.get(url, {
      responseType: 'json',
      ...options,
    })
    const { size } = await prepareStream(stream)
    return { stream, size }
  } catch (err) {
    logger.error(err, 'controller.url.download.error', traceId)
    throw err
  }
}
