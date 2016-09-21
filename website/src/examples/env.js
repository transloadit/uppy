let uppyServerEndpoint = 'http://localhost:3020'

if (location.hostname === 'uppy.io') {
  uppyServerEndpoint = 'https://server.uppy.io:3020'
}

// uppyServerEndpoint = 'http://server.uppy.io:3020'
export const UPPY_SERVER = uppyServerEndpoint
