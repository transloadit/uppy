module.exports = function getSocketHost (url) {
  // get the host domain
  var regex = /^(?:https?:\/\/|\/\/)?(?:[^@\n]+@)?(?:www\.)?([^\n]+)/i
  var host = regex.exec(url)[1]
  var socketProtocol = /^http:\/\//i.test(url) ? 'ws' : 'wss'

  return `${socketProtocol}://${host}`
}
