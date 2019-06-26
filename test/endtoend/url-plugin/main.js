require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const Url = require('@uppy/url')
const Tus = require('@uppy/tus')

function initUrlPlugin (companionUrl) {
  Uppy({
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
    .use(Tus, { endpoint: 'http://localhost:1080/files/' })
}

window.initUrlPlugin = initUrlPlugin
