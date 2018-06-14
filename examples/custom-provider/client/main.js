const Uppy = require('uppy/lib/core')
const GoogleDrive = require('uppy/lib/plugins/GoogleDrive')
const Tus = require('uppy/lib/plugins/Tus')
const MyCustomProvider = require('./MyCustomProvider')
const Dashboard = require('uppy/lib/plugins/Dashboard')

const uppy = Uppy({
  debug: true,
  autoProceed: false
})

uppy.use(GoogleDrive, {
  serverUrl: 'http://localhost:3020'
})

uppy.use(MyCustomProvider, {
  serverUrl: 'http://localhost:3020'
})

uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  plugins: ['GoogleDrive', 'MyCustomProvider']
})

uppy.use(Tus, {endpoint: 'https://master.tus.io/files/'})
