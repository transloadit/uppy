import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import GoogleDrive from '@uppy/google-drive'
import Tus from '@uppy/tus'
import MyCustomProvider from './MyCustomProvider.jsx'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const uppy = new Uppy({
  debug: true,
})

uppy.use(GoogleDrive, {
  companionUrl: 'http://localhost:3020',
})

uppy.use(MyCustomProvider, {
  companionUrl: 'http://localhost:3020',
})

uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  plugins: ['GoogleDrive', 'MyCustomProvider'],
})

uppy.use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
