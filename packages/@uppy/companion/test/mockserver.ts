import express from 'express'
import session from 'express-session'
import { expects as zoomExpects } from './fixtures/zoom.js'

const { localZoomKey, localZoomSecret, localZoomVerificationToken } =
  zoomExpects

const defaultEnv = {
  NODE_ENV: 'test',
  COMPANION_PORT: 3020,
  COMPANION_DOMAIN: 'localhost:3020',
  COMPANION_SELF_ENDPOINT: 'localhost:3020',
  COMPANION_HIDE_METRICS: 'false',
  COMPANION_HIDE_WELCOME: 'false',

  COMPANION_STREAMING_UPLOAD: 'true',
  COMPANION_TUS_DEFERRED_UPLOAD_LENGTH: 'true',
  COMPANION_ALLOW_LOCAL_URLS: 'false',

  COMPANION_PROTOCOL: 'http',
  COMPANION_DATADIR: './test/output',
  COMPANION_SECRET: 'secret',
  COMPANION_PREAUTH_SECRET: 'different secret',

  COMPANION_DROPBOX_KEY: 'dropbox_key',
  COMPANION_DROPBOX_SECRET: 'dropbox_secret',
  COMPANION_DROPBOX_KEYS_ENDPOINT: undefined,
  COMPANION_DROPBOX_SECRET_FILE: undefined,

  COMPANION_BOX_KEY: 'box_key',
  COMPANION_BOX_SECRET: 'box_secret',
  COMPANION_BOX_KEYS_ENDPOINT: undefined,
  COMPANION_BOX_SECRET_FILE: undefined,

  COMPANION_GOOGLE_KEY: 'google_key',
  COMPANION_GOOGLE_SECRET: 'google_secret',
  COMPANION_GOOGLE_KEYS_ENDPOINT: undefined,
  COMPANION_GOOGLE_SECRET_FILE: undefined,

  COMPANION_INSTAGRAM_KEY: 'instagram_key',
  COMPANION_INSTAGRAM_SECRET: 'instagram_secret',
  COMPANION_INSTAGRAM_KEYS_ENDPOINT: undefined,
  COMPANION_INSTAGRAM_SECRET_FILE: undefined,

  COMPANION_FACEBOOK_KEY: 'facebook_key',
  COMPANION_FACEBOOK_SECRET: 'facebook_secret',
  COMPANION_FACEBOOK_KEYS_ENDPOINT: undefined,

  COMPANION_ZOOM_KEY: localZoomKey,
  COMPANION_ZOOM_SECRET: localZoomSecret,
  COMPANION_ZOOM_VERIFICATION_TOKEN: localZoomVerificationToken,
  COMPANION_ZOOM_KEYS_ENDPOINT: undefined,
  COMPANION_ZOOM_SECRET_FILE: undefined,
  COMPANION_ZOOM_VERIFICATION_TOKEN_FILE: undefined,

  COMPANION_PATH: '',

  COMPANION_PERIODIC_PING_URLS: '',
  COMPANION_PERIODIC_PING_INTERVAL: '',
  COMPANION_PERIODIC_PING_COUNT: '',
  COMPANION_PERIODIC_PING_STATIC_JSON_PAYLOAD: '',

  COMPANION_CLIENT_SOCKET_CONNECT_TIMEOUT: '',

  COMPANION_ENABLE_URL_ENDPOINT: 'true',

  COMPANION_CLIENT_ORIGINS: 'true',

  COMPANION_OAUTH_DOMAIN: '',

  COMPANION_AWS_KEY: '',
  COMPANION_AWS_SECRET: '',
  COMPANION_AWS_REGION: '',
  COMPANION_AWS_BUCKET: '',
} satisfies Record<string, string | number | undefined>

function updateEnv(env: Record<string, string | number | undefined>): void {
  Object.keys(env).forEach((key) => {
    const value = env[key]
    if (value == null) delete process.env[key]
    else process.env[key] = String(value)
  })
}

export const setDefaultEnv = () => updateEnv(defaultEnv)

export const grantToken = 'fake token'

// companion stores certain global state, so the user needs to reset modules for each test
// todo rewrite companion to not use global state
// https://github.com/transloadit/uppy/issues/3284
export const getServerWithEmitter = async (
  extraEnv: Record<string, string | number | undefined> = {},
) => {
  const { default: standalone } = await import('../src/standalone/index.js')

  const env = {
    ...defaultEnv,
    ...extraEnv,
  }

  updateEnv(env)

  const authServer = express()

  authServer.use(
    session({ secret: 'grant', resave: true, saveUninitialized: true }),
  )
  authServer.all('*/callback', (req, res, next) => {
    if (req.session) {
      req.session['grant'] = {
        response: { access_token: grantToken },
      }
    }
    next()
  })
  authServer.all(['*/send-token', '*/redirect'], (req, res, next) => {
    const state =
      typeof req.query['state'] === 'string' ? req.query['state'] : null
    if (req.session) {
      req.session['grant'] = {
        dynamic: { state: state ?? 'non-empty-value' },
      }
    }
    next()
  })

  const { app, emitter } = standalone()
  authServer.use(app)
  return { server: authServer, emitter }
}

export const getServer = async (
  extraEnv?: Record<string, string | number | undefined> | undefined,
) => {
  const { server } = await getServerWithEmitter(extraEnv)
  return server
}
