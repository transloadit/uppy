import type { Request, Response } from 'express'
import logger from '../logger.js'

/**
 * Returns the decrypted Dropbox OAuth tokens for the current session.
 **/
export default function bridgeTokens(req: Request, res: Response): void {
  // Responses on this route may carry OAuth tokens — never let them be cached.
  res.set('Cache-Control', 'no-store')

  // The route is `/:providerName/bridge-tokens` because `verifyToken` and the
  // provider middleware are keyed on `:providerName`. A token minted for another
  // provider cannot be read here: `verifyToken` decrypts against this same param,
  // so a mismatched path is rejected by the middleware before reaching this point.
  if (req.params['providerName'] !== 'dropbox') {
    logger.warn(
      `bridge-tokens called for unsupported provider: ${req.params['providerName']}`,
      'bridge-tokens',
      req.id,
    )
    res.status(400).end()
    return
  }

  const session = req.companion.providerUserSession
  if (session?.accessToken == null) {
    // The auth token decrypted fine, but this session has no connected Dropbox
    // account — that is "not found", not an authentication failure.
    logger.info(
      'bridge-tokens: no Dropbox tokens for this session',
      'bridge-tokens',
      req.id,
    )
    res.status(404).end()
    return
  }

  res.json({
    accessToken: session.accessToken,
  })
}
