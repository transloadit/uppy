#!/usr/bin/env node
const companion = require('../companion')
// @ts-ignore
const { version } = require('../../package.json')
const standalone = require('.')

const port = process.env.COMPANION_PORT || 3020

const { app } = standalone()

companion.socket(app.listen(port))

/* eslint-disable no-console */
console.log(`Welcome to Companion! v${version}`)
console.log(`Listening on http://0.0.0.0:${port}`)
