module.exports = function truncateString (str, length) {
  if (str.length > length) {
    return str.substr(0, length / 2) + '...' + str.substr(str.length - length / 4, str.length)
  }
  return str

  // more precise version if needed
  // http://stackoverflow.com/a/831583
}
