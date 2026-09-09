import { vi } from 'vitest'

const mockOauthState = () => {
  vi.mock('../dist/server/helpers/oauth-state.js', async () => ({
    ...(await vi.importActual('../dist/server/helpers/oauth-state.js')),
    generateState: () => ({}),
    getFromState: (state: string) => {
      if (state === 'state-with-invalid-instance-url') {
        return 'http://localhost:3452'
      }

      return 'http://localhost:3020'
    },
    encodeState: () => 'some-cool-nice-encrytpion',
  }))
}

export default mockOauthState
