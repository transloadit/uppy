/**
 * Helper to abort upload requests if there has not been any progress for `timeout` ms.
 * Create an instance using `timer = new ProgressTimeout(10000, onTimeout)`
 * Call `timer.progress()` to signal that there has been progress of any kind.
 * Call `timer.done()` when the upload has completed.
 */
class ProgressTimeout {
  constructor (timeout, timeoutHandler) {
    this._timeout = timeout
    this._onTimedOut = timeoutHandler
    this._isDone = false
    this._aliveTimer = null
    this._onTimedOut = this._onTimedOut.bind(this)
  }

  progress () {
    // Some browsers fire another progress event when the upload is
    // cancelled, so we have to ignore progress after the timer was
    // told to stop.
    if (this._isDone) return

    if (this._timeout > 0) {
      if (this._aliveTimer) clearTimeout(this._aliveTimer)
      this._aliveTimer = setTimeout(this._onTimedOut, this._timeout)
    }
  }

  done () {
    if (this._aliveTimer) {
      clearTimeout(this._aliveTimer)
      this._aliveTimer = null
    }
    this._isDone = true
  }
}

module.exports = ProgressTimeout
