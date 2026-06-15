export default function getSocketHost(url: string): string {
  // get the host domain
  const regex = /^(?:https?:\/\/|\/\/)?(?:[^@\n]+@)?([^\n]+)/i
  const host = regex.exec(url)?.[1]
  const socketProtocol = /^http:\/\//i.test(url) ? 'ws' : 'wss'

  return `${socketProtocol}://${host}`
}
