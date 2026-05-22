import type { Request, Response } from 'express'

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
    res
      .status(400)
      .json({ error: 'The bridge-tokens endpoint only supports Dropbox.' })
    return
  }

  const session = req.companion.providerUserSession
  if (session?.accessToken == null) {
    // The auth token decrypted fine, but this session has no connected Dropbox
    // account — that is "not found", not an authentication failure.
    res.status(404).json({ error: 'No Dropbox tokens for this session.' })
    return
  }

  res.json({
    accessToken: session.accessToken,
  })
}
