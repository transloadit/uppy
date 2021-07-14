/**
 * Returns a timestamp in the format of `hours:minutes:seconds`
 */
module.exports = function getTimeStamp () {
  const date = new Date()
  const hours = pad(date.getHours().toString())
  const minutes = pad(date.getMinutes().toString())
  const seconds = pad(date.getSeconds().toString())
  return `${hours}:${minutes}:${seconds}`
}

/**
 * Adds zero to strings shorter than two characters
 */
function pad (str) {
  return str.length !== 2 ? 0 + str : str
}
