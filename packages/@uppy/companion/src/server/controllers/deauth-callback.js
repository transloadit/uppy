const { errorToResponse } = require('../provider/error')

function deauthCallback ({ body, companion, headers }, res, next) {
  // we need the provider instance to decide status codes because
  // this endpoint does not cater to a uniform client.
  // It doesn't respond to Uppy client like other endpoints.
  // Instead it responds to the providers themselves.
  companion.provider.deauthorizationCallback({ companion, body, headers }, (err, data, status) => {
    if (err) {
      const errResp = errorToResponse(err)
      if (errResp) {
        return res.status(errResp.code).json({ message: errResp.message })
      }
      return next(err)
    }
    return res.status(status || 200).json(data)
  })
}

module.exports = deauthCallback
