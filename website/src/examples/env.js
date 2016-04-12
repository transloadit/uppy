let uppyServerEndpoint = 'http://localhost:8080'

if (location.hostname === 'uppy.io') {
  uppyServerEndpoint = 'http://server.uppy.io:3020'
}

// uppyServerEndpoint = 'http://server.uppy.io:3020'
export const UPPY_SERVER = uppyServerEndpoint
