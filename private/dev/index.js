// eslint-disable-next-line import/no-extraneous-dependencies
import Form from '@uppy/form'

// eslint-disable-next-line import/no-extraneous-dependencies
import Dashboard from '@uppy/dashboard'

// eslint-disable-next-line import/no-extraneous-dependencies
import 'uppy/src/style.scss'

import DragDrop from './DragDrop.js'
import DashboardUppy from './Dashboard.js'


switch (window.location.pathname.toLowerCase()) {
  case '/':
  case '/dashboard.html': {
    const restrictions = undefined
    // const restrictions = { requiredMetaFields: ['caption'], maxNumberOfFiles: 3 }

    const uppy = DashboardUppy({ restrictions })
      .use(Dashboard, {
        trigger: '#pick-files',
        // inline: true,
        target: '.foo',
        metaFields: [
          { id: 'license', name: 'License', placeholder: 'specify license' },
          { id: 'caption', name: 'Caption', placeholder: 'add caption' },
        ],
        showProgressDetails: true,
        proudlyDisplayPoweredByUppy: true,
        note: `${JSON.stringify(restrictions)}`,
      })
      .use(Form, { target: '#upload-form' })

    window.uppy = uppy

    const modalTrigger = document.querySelector('#pick-files')
    if (modalTrigger) modalTrigger.click()
  }
  break
  case '/dragdrop.html': DragDrop(); break
  default: throw new Error('404')
}

if ('serviceWorker' in navigator) {
  // eslint-disable-next-line compat/compat
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope)
    })
    .catch((error) => {
      console.log(`Registration failed with ${error}`)
    })
}
