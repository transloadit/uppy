require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const GoogleDrive = require('@uppy/google-drive')
const Instagram = require('@uppy/instagram')
const Dropbox = require('@uppy/dropbox')
const Tus = require('@uppy/tus')

Uppy({
  id: 'uppyProvider',
  debug: true,
  autoProceed: true
})
  .use(Dashboard, {
    target: '#uppyDashboard',
    inline: true
  })
  .use(GoogleDrive, { target: Dashboard, companionUrl: 'http://localhost:3020' })
  .use(Instagram, { target: Dashboard, companionUrl: 'http://localhost:3020' })
  .use(Dropbox, { target: Dashboard, companionUrl: 'http://localhost:3020' })
  .use(Tus, { endpoint: 'http://localhost:1080/files/' })
