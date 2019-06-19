// Polyfills, primarily for testing in IE11
require('es6-promise/auto')
require('whatwg-fetch')

const DragDrop = require('./DragDrop.js')
const Dashboard = require('./Dashboard.js')

switch (window.location.pathname.toLowerCase()) {
  case '/':
  case '/dashboard.html': Dashboard(); break
  case '/dragdrop.html': DragDrop(); break
}

if ('serviceWorker' in navigator) {
  // eslint-disable-next-line compat/compat
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope)
    })
    .catch((error) => {
      console.log('Registration failed with ' + error)
    })
}
