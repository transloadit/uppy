require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const Tus = require('@uppy/tus')

const uppyDashboard = Uppy({
  id: 'uppyDashboard',
  debug: true
})

uppyDashboard
  .use(Dashboard, {
    target: '#uppyDashboard',
    inline: true
  })
  .use(Tus, { endpoint: 'http://localhost:1080/files/' })
