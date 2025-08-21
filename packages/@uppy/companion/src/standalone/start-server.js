#!/usr/bin/env node
import packageJson from '../../package.json' with { type: 'json' }
import * as companion from '../companion.js'
import logger from '../server/logger.js'
import standalone from './index.js'

const port = process.env.COMPANION_PORT || process.env.PORT || 3020

const { app } = standalone()

companion.socket(app.listen(port))

logger.info(`Welcome to Companion! v${packageJson.version}`)
logger.info(`Listening on http://localhost:${port}`)
