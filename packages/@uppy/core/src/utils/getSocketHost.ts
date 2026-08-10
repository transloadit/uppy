import stripTrailingSlash from './stripTrailingSlash.js'

export default function getSocketHost(url: string): string {
  // get the host domain
  const regex = /^(?:https?:\/\/|\/\/)?(?:[^@\n]+@)?([^\n]+)/i
  const match = regex.exec(url)?.[1]
  const host = match == null ? match : stripTrailingSlash(match)
  const socketProtocol = /^http:\/\//i.test(url) ? 'ws' : 'wss'

  return `${socketProtocol}://${host}`
}
