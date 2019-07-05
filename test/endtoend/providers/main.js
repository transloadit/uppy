require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const GoogleDrive = require('@uppy/google-drive')
const Instagram = require('@uppy/instagram')
const Dropbox = require('@uppy/dropbox')
const Tus = require('@uppy/tus')

const isOnTravis = !!(process.env.TRAVIS && process.env.CI)
const companionUrl = isOnTravis ? 'http://companion.test:3030' : 'http://localhost:3030'

window.uppy = Uppy({
  id: 'uppyProvider',
  debug: true,
  autoProceed: true
})
  .use(Dashboard, {
    target: '#uppyDashboard',
    inline: true
  })
  .use(GoogleDrive, { target: Dashboard, companionUrl })
  .use(Instagram, { target: Dashboard, companionUrl })
  .use(Dropbox, { target: Dashboard, companionUrl })
  .use(Tus, { endpoint: 'http://localhost:1080/files/' })
