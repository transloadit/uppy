require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const Tus = require('@uppy/tus')

const isOnTravis = !!(process.env.TRAVIS && process.env.CI)
const endpoint = isOnTravis ? 'http://test-companion.uppy.io:1080' : 'http://localhost:1080'

const uppyDashboard = Uppy({
  id: 'uppyDashboard',
  debug: true
})

uppyDashboard
  .use(Dashboard, {
    target: '#uppyDashboard',
    inline: true
  })
  .use(Tus, { endpoint: `${endpoint}/files/` })
