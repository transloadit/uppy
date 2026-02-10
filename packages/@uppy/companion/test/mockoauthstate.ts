import { vi } from 'vitest'

const mockOauthState = () => {
  vi.mock('../src/server/helpers/oauth-state.ts', async () => ({
    ...(await vi.importActual('../src/server/helpers/oauth-state.ts')),
    generateState: () => ({}),
    getFromState: (state: unknown) => {
      if (state === 'state-with-invalid-instance-url') {
        return 'http://localhost:3452'
      }

      return 'http://localhost:3020'
    },
    encodeState: () => 'some-cool-nice-encrytpion',
  }))
}

export default mockOauthState
