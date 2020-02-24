const { app } = require('../src/standalone')

const express = require('express')
const session = require('express-session')
var authServer = express()

authServer.use(session({ secret: 'grant', resave: true, saveUninitialized: true }))
authServer.all('*/callback', (req, res, next) => {
  req.session.grant = {
    response: { access_token: 'fake token' }
  }
  next()
})
authServer.all('*/send-token', (req, res, next) => {
  req.session.grant = { dynamic: { state: req.query.state || 'non-empty-value' } }
  next()
})

authServer.use(app)

module.exports = { authServer }
