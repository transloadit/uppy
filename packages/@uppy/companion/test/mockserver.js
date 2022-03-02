/* global jest:false */
const express = require('express')
const session = require('express-session')

const defaultEnv = {
  NODE_ENV: 'test',
  COMPANION_PORT: 3020,
  COMPANION_DOMAIN: 'localhost:3020',
  COMPANION_SELF_ENDPOINT: 'localhost:3020',
  COMPANION_HIDE_METRICS: 'false',
  COMPANION_HIDE_WELCOME: 'false',

  COMPANION_STREAMING_UPLOAD: 'true',

  COMPANION_PROTOCOL: 'http',
  COMPANION_DATADIR: './test/output',
  COMPANION_SECRET: 'secret',

  COMPANION_DROPBOX_KEY: 'dropbox_key',
  COMPANION_DROPBOX_SECRET: 'dropbox_secret',

  COMPANION_BOX_KEY: 'box_key',
  COMPANION_BOX_SECRET: 'box_secret',

  COMPANION_GOOGLE_KEY: 'google_key',
  COMPANION_GOOGLE_SECRET: 'google_secret',

  COMPANION_INSTAGRAM_KEY: 'instagram_key',
  COMPANION_INSTAGRAM_SECRET: 'instagram_secret',

  COMPANION_ZOOM_KEY: 'zoom_key',
  COMPANION_ZOOM_SECRET: 'zoom_secret',
  COMPANION_ZOOM_VERIFICATION_TOKEN: 'zoom_verfication_token',

  COMPANION_PATH: '',
}

function updateEnv (env) {
  Object.keys(env).forEach((key) => {
    process.env[key] = env[key]
  })
}

module.exports.setDefaultEnv = () => updateEnv(defaultEnv)

module.exports.getServer = (extraEnv) => {
  const env = {
    ...defaultEnv,
    ...extraEnv,
  }

  updateEnv(env)

  // delete from cache to force the server to reload companionOptions from the new env vars
  jest.resetModules()
  const standalone = require('../src/standalone')
  const authServer = express()

  authServer.use(session({ secret: 'grant', resave: true, saveUninitialized: true }))
  authServer.all('*/callback', (req, res, next) => {
    req.session.grant = {
      response: { access_token: 'fake token' },
    }
    next()
  })
  authServer.all(['*/send-token', '*/redirect'], (req, res, next) => {
    req.session.grant = { dynamic: { state: req.query.state || 'non-empty-value' } }
    next()
  })

  const { app } = standalone()
  authServer.use(app)
  return authServer
}
