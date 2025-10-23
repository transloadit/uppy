import 'uppy/dist/uppy.css'
import uppyStyles from 'uppy/dist/uppy.css?inline'

import Dashboard from './Dashboard.js'
import DragDrop from './DragDrop.js'

switch (window.location.pathname.toLowerCase()) {
  case '/':
  case '/dashboard.html':
    Dashboard({
      trigger: '#pick-files',
      target: '.foo',
    })
    break
  case '/dragdrop.html':
    DragDrop()
    break
  case '/dashboard_shadow.html':
    const shadowRoot = document.getElementById('shadow-host').shadowRoot;
    if (!shadowRoot) break;
    // Apply Uppy styles to the Shadow DOM
    const uppyCSS = new CSSStyleSheet();
    uppyCSS.replaceSync(uppyStyles)
    shadowRoot.adoptedStyleSheets = [
      ...shadowRoot.adoptedStyleSheets,
      uppyCSS,
    ];
    // Run in the Shadow DOM
    Dashboard({
      trigger: shadowRoot.querySelector('#pick-files'),
      target: shadowRoot.querySelector('.foo'),
    })
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
