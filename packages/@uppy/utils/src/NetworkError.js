class NetworkError extends Error {
  constructor (error, xhr = null) {
    super(`This looks like a network error, the endpoint might be blocked by an internet provider or a firewall.`)

    this.cause = error
    this.isNetworkError = true
    this.request = xhr
  }
}

export default NetworkError
