#!/usr/bin/env node
import companion = require('../companion')
import standalone = require('.')
import logger = require('../server/logger')

// We don't want TS to resolve the following require, otherwise it wraps the
// output files in `lib/src/` instead of `lib/`.
const { version } = require('../../package.json') as { version: string }

const port = process.env.COMPANION_PORT || process.env.PORT || 3020

const { app } = standalone()

companion.socket(app.listen(port))

logger.info(`Welcome to Companion! v${version}`)
logger.info(`Listening on http://localhost:${port}`)
