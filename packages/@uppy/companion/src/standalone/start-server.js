#!/usr/bin/env node
const companion = require('../companion')
// @ts-ignore
const { version } = require('../../package.json')
const standalone = require('.')
const logger = require('../server/logger')

const port = process.env.COMPANION_PORT || process.env.PORT || 3020

const { app } = standalone()

companion.socket(app.listen(port))

logger.info(`Welcome to Companion! v${version}`)
logger.info(`Listening on http://localhost:${port}`)
