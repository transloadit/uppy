import { respondWithError } from '../provider/error.js'

/**
 *
 * @param {object} req
 * @param {object} res
 */
async function thumbnail(req, res, next) {
  const { id } = req.params
  const { provider, providerUserSession } = req.companion

  try {
    const { stream, contentType } = await provider.thumbnail({
      id,
      providerUserSession,
    })
    if (contentType != null) res.set('Content-Type', contentType)
    stream.pipe(res)
  } catch (err) {
    if (respondWithError(err, res)) return
    next(err)
  }
}

export default thumbnail
