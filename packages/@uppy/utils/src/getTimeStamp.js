/**
 * Returns a timestamp in the format of `hours:minutes:seconds`
*/
module.exports = function getTimeStamp () {
  var date = new Date()
  var hours = pad(date.getHours().toString())
  var minutes = pad(date.getMinutes().toString())
  var seconds = pad(date.getSeconds().toString())
  return hours + ':' + minutes + ':' + seconds
}

/**
 * Adds zero to strings shorter than two characters
*/
function pad (str) {
  return str.length !== 2 ? 0 + str : str
}
