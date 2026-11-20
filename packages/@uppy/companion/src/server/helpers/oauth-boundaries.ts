import type { RequestHandler } from '../../types/express.js'

import { isRecord } from './type-guards.js'

/** Prevent Grant from copying arbitrary or recursive input into the session. */
export function guardGrantInput(
  getDynamicFields: (provider: string) => readonly string[] | undefined,
): RequestHandler {
  return (req, res, next) => {
    const provider = req.params['oauthProvider']
    const dynamicFields =
      typeof provider === 'string' ? getDynamicFields(provider) : undefined
    if (dynamicFields == null) {
      res.sendStatus(400)
      return
    }
    // Providers add their own callback parameters (Google's `iss`, Facebook's
    // `error_reason`, ...), so callbacks are bounded by type and size only.
    const allowedFields =
      req.params['override'] === 'callback'
        ? undefined
        : new Set(['state', ...dynamicFields])
    let bytes = 0
    let fields = 0
    for (const input of [req.query, req.body]) {
      if (input == null) continue
      if (!isRecord(input)) {
        res.sendStatus(400)
        return
      }
      // Stop at the budget rather than enumerating an entire host-parsed object.
      for (const key in input) {
        if (!Object.hasOwn(input, key)) continue
        fields++
        const value = input[key]
        if (
          fields > 32 ||
          (allowedFields && !allowedFields.has(key)) ||
          typeof value !== 'string'
        ) {
          res.sendStatus(400)
          return
        }
        bytes += Buffer.byteLength(key) + Buffer.byteLength(value)
        if (bytes > 8192) {
          res.sendStatus(413)
          return
        }
      }
    }
    next()
  }
}

/** OAuth cookie-authenticated results belong to browser navigations, not fetch. */
export const requireOAuthNavigation: RequestHandler = (req, res, next) => {
  const mode = req.get('sec-fetch-mode')
  if ((mode && mode !== 'navigate') || (!mode && req.get('origin'))) {
    res.sendStatus(403)
    return
  }
  next()
}
