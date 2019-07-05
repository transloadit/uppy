require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const Url = require('@uppy/url')
const Tus = require('@uppy/tus')

const isOnTravis = !!(process.env.TRAVIS && process.env.CI)
const companionUrl = isOnTravis ? 'http://test-companion.uppy.io:3030' : 'http://localhost:3030'
const endpoint = isOnTravis ? 'http://test-companion.uppy.io:1080' : 'http://localhost:1080'

window.uppy = Uppy({
  id: 'uppyProvider',
  debug: true
})
  .use(Dashboard, {
    target: '#uppyDashboard',
    inline: true
  })
  .use(Url, {
    target: Dashboard,
    companionUrl: companionUrl
  })
  .use(Tus, { endpoint: `${endpoint}/files/` })
