class NetworkError extends Error {
  constructor (error, xhr = null) {
    super(`This looks like a network error, the endpoint might be blocked by an internet provider or a firewall.\n\nSource error: [${error}]`)

    this.isNetworkError = true
    this.request = xhr
  }
}

module.exports = NetworkError
