let companionEndpoint = 'http://localhost:3020'

if (location.hostname === 'uppy.io') {
  companionEndpoint = '//companion.uppy.io'
}

const COMPANION = companionEndpoint
module.exports = COMPANION
