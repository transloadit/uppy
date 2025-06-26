// https://stackoverflow.com/a/3561711/6519037
function escapeRegex(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
}

function wrapInRegex(value?: string | RegExp): RegExp | undefined {
  if (typeof value === 'string') {
    // TODO in the next major we should change this to `new RegExp(value)` so that the user can control start/end characters
    return new RegExp(`^${value}$`) // throws if invalid regex
  }
  if (value instanceof RegExp) {
    return value
  }
  return undefined
}

export default function getAllowedHosts(
  companionAllowedHosts: string | RegExp | Array<string | RegExp> | undefined,
  companionUrl: string,
): string | RegExp | Array<string | RegExp> {
  if (companionAllowedHosts) {
    const validate = (value: string | RegExp) => {
      if (
        !(typeof value === 'string' && wrapInRegex(value)) && // wrapInRegex throws if invalid regex
        !(value instanceof RegExp)
      ) {
        throw new TypeError(
          `The option "companionAllowedHosts" must be one of string, Array, RegExp`,
        )
      }
    }

    if (Array.isArray(companionAllowedHosts)) {
      companionAllowedHosts.every(validate)
    } else {
      validate(companionAllowedHosts)
    }
    return companionAllowedHosts
  }

  // if it does not start with https://, prefix it (and remove any leading slashes)
  let ret = companionUrl
  if (/^(?!https?:\/\/).*$/i.test(ret)) {
    ret = `https://${companionUrl.replace(/^\/\//, '')}`
  }
  ret = new URL(ret).origin

  ret = escapeRegex(ret)
  return ret
}

export function isOriginAllowed(
  origin: string,
  allowedOrigin: string | RegExp | Array<string | RegExp> | undefined,
): boolean {
  const patterns = Array.isArray(allowedOrigin)
    ? allowedOrigin.map(wrapInRegex)
    : [wrapInRegex(allowedOrigin)]
  return patterns.some(
    (pattern) => pattern?.test(origin) || pattern?.test(`${origin}/`),
  ) // allowing for trailing '/'
}
