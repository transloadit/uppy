#!/usr/bin/env node
const companion = require('../companion')
// @ts-ignore
const { version } = require('../../package.json')
const standalone = require('.')
const { getURLBuilder } = require('../server/helpers/utils')

const port = process.env.COMPANION_PORT || process.env.PORT || 3020

const { app, companionOptions } = standalone()

companion.socket(app.listen(port))

const buildURL = getURLBuilder(companionOptions)

/* eslint-disable no-console */
console.log(`Welcome to Companion! v${version}`)
console.log(`Listening on ${buildURL('/', false)}`)
