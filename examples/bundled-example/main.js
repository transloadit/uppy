const Uppy = require('../../src/core')
const Dashboard = require('../../src/plugins/Dashboard')
const GoogleDrive = require('../../src/plugins/GoogleDrive')
const Dropbox = require('../../src/plugins/Dropbox')
const Instagram = require('../../src/plugins/Instagram')
// const Webcam = require('../../src/plugins/Webcam')
const Tus = require('../../src/plugins/Tus')
const Transloadit = require('../../src/plugins/Transloadit')
// const Multipart = require('../../src/plugins/Multipart')
// const FileInput = require('../../src/plugins/FileInput')
// const MetaData = require('../../src/plugins/MetaData')
// const Informer = require('../../src/plugins/Informer')
// const StatusBar = require('../../src/plugins/StatusBar')
// const DragDrop = require('../../src/plugins/DragDrop')
const GoldenRetriever = require('../../src/plugins/GoldenRetriever')

const PROTOCOL = location.protocol === 'https:' ? 'https' : 'http'
const TUS_ENDPOINT = PROTOCOL + '://master.tus.io/files/'

console.warn(`

  STARTING EXAMPLE!

`)

const uppy = Uppy({
  debug: true,
  autoProceed: false,
  meta: {
    username: 'John',
    license: 'Creative Commons'
  }
})
  .use(Dashboard, {
    trigger: '#uppyModalOpener',
    inline: false,
    disableStatusBar: false,
    disableInformer: false,
    getMetaFromForm: true,
    replaceTargetContent: false,
    hideUploadButton: false,
    closeModalOnClickOutside: false,
    metaFields: [
      { id: 'license', name: 'License', value: 'Creative Commons', placeholder: 'specify license' },
      { id: 'caption', name: 'Caption', value: 'none', placeholder: 'describe what the image is about' }
    ],
    locale: {
      strings: {browse: 'browse'}
    }
  })
  .use(GoogleDrive, {target: Dashboard, host: 'http://localhost:3020'})
  .use(Dropbox, {target: Dashboard, host: 'http://localhost:3020'})
  .use(Instagram, {target: Dashboard, host: 'http://localhost:3020'})
  // .use(Tus, { resume: false })
  .use(require('../../src/plugins/XHRUpload'))
  .use(require('../../src/plugins/AwsS3'), {
    host: 'http://localhost:3020'
  })
  .run()
  .use(Transloadit, {
    importFromUploadURLs: true,
    // alwaysRunAssembly: true,
    waitForEncoding: true,
    params: {
      auth: { key: '05a61ed019fe11e783fdbd1f56c73eb0' },
      template_id: 'ff1fb8201b7211e7bbafa9a78f1dc173'
    }
  })
  .use(GoldenRetriever, {})

uppy.on('complete', ({ successful, failed }) => {
  if (failed.length === 0) {
    console.log('UPLOAD SUCCESSFUL!!!')
  } else {
    console.warn('UPLOAD FAILED!!!')
  }
  console.log('successful files:', successful)
  console.log('failed files:', failed)
  localStorage.savedResults = '[]'
})

const wrapper = document.createElement('div')
const yo = require('yo-yo')
function render () {
  yo.update(wrapper, yo`
    <div style="margin-top: 20px;">
      <h1>Results (${results.length})</h1>
      <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
        ${results.map(ResultPreview)}
      </div>
    </div>
  `)
}

function ResultPreview (result) {
  if (result.type === 'image') {
    return yo`<img class="UppyDemo-resultImg" src="${result.ssl_url}" />`
  }
  if (result.type === 'video') {
    return yo`<video width="320" height="240" src="${result.ssl_url}" />`
  }
  if (result.type === 'audio') {
    return yo`<audio width="320" height="52" src="${result.ssl_url}" />`
  }

  return ''
}

let results = []
try {
  results = JSON.parse(localStorage.savedResults)
  render()
} catch (err) {}

uppy.on('transloadit:result', (stepName, result) => {
  results.push({ ssl_url: result.ssl_url, type: result.type })
  render()
  localStorage.savedResults = JSON.stringify(results)
>>>>>>> Stashed changes
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope)
    })
    .catch((error) => {
      console.log('Registration failed with ' + error)
    })
}

var modalTrigger = document.querySelector('#uppyModalOpener')
if (modalTrigger) modalTrigger.click()

document.body.appendChild(wrapper)
