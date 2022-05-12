/**
 * Helper to abort upload requests if there has not been any progress for `timeout` ms.
 * Create an instance using `timer = new ProgressTimeout(10000, onTimeout)`
 * Call `timer.progress()` to signal that there has been progress of any kind.
 * Call `timer.done()` when the upload has completed.
 */
class ProgressTimeout {
  #aliveTimer

  #isDone = false

  #onTimedOut

  #timeout

  constructor (timeout, timeoutHandler) {
    this.#timeout = timeout
    this.#onTimedOut = timeoutHandler
  }

  progress () {
    // Some browsers fire another progress event when the upload is
    // cancelled, so we have to ignore progress after the timer was
    // told to stop.
    if (this.#isDone) return

    if (this.#timeout > 0) {
      clearTimeout(this.#aliveTimer)
      this.#aliveTimer = setTimeout(this.#onTimedOut, this.#timeout)
    }
  }

  done () {
    if (!this.#isDone) {
      clearTimeout(this.#aliveTimer)
      this.#aliveTimer = null
      this.#isDone = true
    }
  }
}

export default ProgressTimeout
