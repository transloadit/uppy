const Uppy = require('@uppy/core')
const GoogleDrive = require('@uppy/google-drive')
const Tus = require('@uppy/tus')
const MyCustomProvider = require('./MyCustomProvider')
const Dashboard = require('@uppy/dashboard')

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
