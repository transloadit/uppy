#!/usr/bin/env node

'use strict'

const userAgent = process.env.npm_config_user_agent
if (!userAgent) {
  // not much we can do
  process.exit()
}

if (/^npm\/7/.test(userAgent)) {
  console.error('Please use npm 6 to work in the Uppy monorepo.')
  console.error('You can execute individual commands with npm 6 like below:')
  console.error()
  console.error('  $ npx npm@6 install')
  console.error()
  console.error('This way you can still use npm 7 in your other projects.')
  process.exit(1)
}
