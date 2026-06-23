class NetworkError extends Error {
  public cause: unknown

  public isNetworkError: true

  public request: null | XMLHttpRequest

  constructor(error: unknown, xhr: null | XMLHttpRequest = null) {
    super(
      `This looks like a network error, the endpoint might be blocked by an internet provider or a firewall.`,
    )

    this.cause = error
    this.isNetworkError = true
    this.request = xhr
  }
}

export default NetworkError
