/**
 * Helper to abort upload requests if there has not been any progress for `timeout` ms.
 * Create an instance using `timer = new ProgressTimeout(10000, onTimeout)`
 * Call `timer.progress()` to signal that there has been progress of any kind.
 * Call `timer.done()` when the upload has completed.
 */
class ProgressTimeout {
  #aliveTimer?: ReturnType<typeof setTimeout>

  #isDone = false

  #onTimedOut: Parameters<typeof setTimeout>[0]

  #timeout: number

  constructor(timeout: number, timeoutHandler: (timeout: number) => void) {
    this.#timeout = timeout
    this.#onTimedOut = () => timeoutHandler(timeout)
  }

  progress(): void {
    // Some browsers fire another progress event when the upload is
    // cancelled, so we have to ignore progress after the timer was
    // told to stop.
    if (this.#isDone) return

    if (this.#timeout > 0) {
      clearTimeout(this.#aliveTimer)
      this.#aliveTimer = setTimeout(this.#onTimedOut, this.#timeout)
    }
  }

  done(): void {
    if (!this.#isDone) {
      clearTimeout(this.#aliveTimer)
      this.#aliveTimer = undefined
      this.#isDone = true
    }
  }
}

export default ProgressTimeout
