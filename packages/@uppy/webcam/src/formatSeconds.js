/**
 * Takes an Integer value of seconds (e.g. 83) and converts it into a human-readable formatted string (e.g. '1:23').
 *
 * @param {Integer} seconds
 * @returns {string} the formatted seconds (e.g. '1:23' for 1 minute and 23 seconds)
 *
 */
module.exports = function formatSeconds (seconds) {
  return `${Math.floor(
        seconds / 60
      )}:${String(seconds % 60).padStart(2, 0)}`
}
