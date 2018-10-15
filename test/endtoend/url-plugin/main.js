require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const Url = require('@uppy/url')
const Tus = require('@uppy/tus')

Uppy({
  id: 'uppyProvider',
  debug: true
})
  .use(Dashboard, {
    target: '#uppyDashboard',
    inline: true
  })
  .use(Url, { target: Dashboard, serverUrl: 'http://localhost:3020' })
  .use(Tus, { endpoint: 'https://master.tus.io/files/' })
