import { vi } from 'vitest'

const mockOauthState = () => {
  vi.mock('../src/server/helpers/oauth-state.js', async () => ({
    ...(await vi.importActual('../src/server/helpers/oauth-state.js')),
    generateState: () => ({}),
    getFromState: (state) => {
      if (state === 'state-with-invalid-instance-url') {
        return 'http://localhost:3452'
      }

      return 'http://localhost:3020'
    },
    encodeState: () => 'some-cool-nice-encrytpion',
  }))
}

export default mockOauthState
