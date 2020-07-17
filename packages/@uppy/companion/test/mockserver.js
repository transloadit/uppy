/* global jest:false */
const express = require('express')
const session = require('express-session')

module.exports.getServer = (env) => {
  if (env) {
    Object.keys(env).forEach((key) => {
      process.env[key] = env[key]
    })
  }

  // delete from cache to force the server to reload companionOptions from the new env vars
  jest.resetModules()
  const { app } = require('../src/standalone')
  const authServer = express()

  authServer.use(session({ secret: 'grant', resave: true, saveUninitialized: true }))
  authServer.all('*/callback', (req, res, next) => {
    req.session.grant = {
      response: { access_token: 'fake token' }
    }
    next()
  })
  authServer.all(['*/send-token', '*/redirect'], (req, res, next) => {
    req.session.grant = { dynamic: { state: req.query.state || 'non-empty-value' } }
    next()
  })

  authServer.use(app)
  return authServer
}
