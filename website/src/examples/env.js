let uppyServerEndpoint = 'http://localhost:3020'

if (location.hostname === 'uppy.io') {
  uppyServerEndpoint = '//server.uppy.io'
}

const UPPY_SERVER = uppyServerEndpoint
module.exports = UPPY_SERVER
