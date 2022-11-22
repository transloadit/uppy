#!/usr/bin/env node
const companion = require('../companion')
// @ts-ignore
const { version } = require('../../package.json')
const standalone = require('.')
const logger = require('../server/logger')
const { getURLBuilder } = require('../server/helpers/utils')

const port = process.env.COMPANION_PORT || process.env.PORT || 3020

const { app, companionOptions } = standalone()

companion.socket(app.listen(port))

const buildURL = getURLBuilder(companionOptions)

logger.info(`Welcome to Companion! v${version}`)
logger.info(`Listening on ${buildURL('/', false)}`)
