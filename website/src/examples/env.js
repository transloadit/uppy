let companionEndpoint = 'http://localhost:3020'

// eslint-disable-next-line no-restricted-globals
if (location.hostname === 'uppy.io' || /--uppy\.netlify\.app$/.test(location.hostname)) {
  companionEndpoint = '//companion.uppy.io'
}

const COMPANION = companionEndpoint
module.exports = COMPANION
