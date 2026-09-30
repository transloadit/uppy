import 'uppy/dist/uppy.css'

import Dashboard from './Dashboard.js'
import DragDrop from './DragDrop.js'

import.meta.env.VITE_TRANSLOADIT_KEY &&= '***' // to avoid leaking secrets in screenshots.
import.meta.env.VITE_TRANSLOADIT_SECRET &&= '***' // to avoid leaking secrets in screenshots.
console.log(import.meta.env)

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
    .register('./sw.js', { type: 'module' })
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
