module.exports = function parseUrl (url) {
  const scheme = /^\w+:\/\//.exec(url)
  let i = 0
  if (scheme) {
    i = scheme[0].length + 1
  }
  const slashIndex = url.indexOf('/', i)
  if (slashIndex === -1) {
    return {
      origin: url,
      pathname: '/'
    }
  }

  return {
    origin: url.slice(0, slashIndex),
    pathname: url.slice(slashIndex)
  }
}
