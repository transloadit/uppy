// eslint-disable-next-line import/no-extraneous-dependencies
import 'uppy/src/style.scss'

import DragDrop from './DragDrop.js'
import Dashboard from './Dashboard.js'

switch (window.location.pathname.toLowerCase()) {
  case '/':
  case '/dashboard.html': Dashboard(); break
  case '/dragdrop.html': DragDrop(); break
  default: throw new Error('404')
}

if ('serviceWorker' in navigator) {
  
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope)
    })
    .catch((error) => {
      console.log(`Registration failed with ${error}`)
    })
}
