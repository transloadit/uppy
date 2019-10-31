#!/usr/bin/env node
const companion = require('../companion')
// @ts-ignore
const { version } = require('../../package.json')
const { app } = require('.')
const port = process.env.COMPANION_PORT || 3020

companion.socket(app.listen(port))

console.log(`Welcome to Companion! v${version}`)
console.log(`Listening on http://0.0.0.0:${port}`)
