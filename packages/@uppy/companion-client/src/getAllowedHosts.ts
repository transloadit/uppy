export default function getAllowedHosts(
  hosts: string | RegExp | Array<string | RegExp> | undefined,
  url: string,
): string | RegExp | Array<string | RegExp> {
  if (hosts) {
    if (
      typeof hosts !== 'string' &&
      !Array.isArray(hosts) &&
      !(hosts instanceof RegExp)
    ) {
      throw new TypeError(
        `The option "companionAllowedHosts" must be one of string, Array, RegExp`,
      )
    }
    return hosts
  }
  // does not start with https://
  if (/^(?!https?:\/\/).*$/i.test(url)) {
    return `https://${url.replace(/^\/\//, '')}`
  }
  return new URL(url).origin
}
