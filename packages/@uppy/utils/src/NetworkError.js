class NetworkError extends Error {
  constructor (error = null, xhr = null) {
    super(error.message)

    this.isNetworkError = true
    this.originalRequest = xhr

    const message = error.message + '. This looks like a network error, the endpoint might be blocked by an ISP or a firewall'
    this.message = message
  }
}

module.exports = NetworkError
