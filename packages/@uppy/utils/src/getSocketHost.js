export default function getSocketHost (url) {
  // get the host domain
  const regex = /^(?:https?:\/\/|\/\/)?(?:[^@\n]+@)?(?:www\.)?([^\n]+)/i
  const host = regex.exec(url)[1]
  const socketProtocol = /^http:\/\//i.test(url) ? 'ws' : 'wss'

  return `${socketProtocol}://${host}`
}
