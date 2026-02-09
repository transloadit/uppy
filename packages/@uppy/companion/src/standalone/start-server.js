#!/usr/bin/env node
import packageJson from '../../package.json' with { type: 'json' }
import * as companion from '../companion.js'
import logger from '../server/logger.js'
import standalone from './index.js'

const port = process.env.COMPANION_PORT || process.env.PORT || 3020

const { app } = standalone()

const server = app.listen(port, (error) => {
  if (error) {
    logger.error(`Failed to start Companion server: ${error.message}`)
    process.exitCode = 1
  } else {
    logger.info(`Welcome to Companion! v${packageJson.version}`)
    logger.info(`Listening on http://localhost:${port}`)

    companion.socket(server)
  }
})
