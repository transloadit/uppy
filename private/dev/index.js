import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'
import '@uppy/provider-views/css/style.css'
import '@uppy/url/css/style.css'
import '@uppy/webcam/css/style.css'
import '@uppy/audio/css/style.css'
import '@uppy/screen-capture/css/style.css'
import '@uppy/image-editor/css/style.css'
import '@uppy/image-generator/css/style.css'
import '@uppy/drop-target/css/style.css'

import Dashboard from './Dashboard.js'
import DragDrop from './DragDrop.js'

switch (window.location.pathname.toLowerCase()) {
  case '/':
  case '/dashboard.html':
    Dashboard()
    break
  case '/dragdrop.html':
    DragDrop()
    break
  default:
    throw new Error('404')
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log(
        'ServiceWorker registration successful with scope: ',
        registration.scope,
      )
    })
    .catch((error) => {
      console.log(`Registration failed with ${error}`)
    })
}
