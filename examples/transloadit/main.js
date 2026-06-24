import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Form from '@uppy/form'
import ImageEditor from '@uppy/image-editor'
import RemoteSources from '@uppy/remote-sources'
import Transloadit, { COMPANION_URL } from '@uppy/transloadit'
import Webcam from '@uppy/webcam'
import GoldenRetriever from '@uppy/golden-retriever'
import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'
import '@uppy/image-editor/css/style.css'

const TRANSLOADIT_KEY = 'RsiWVN5IVqWNbSjPnk79p40TEHnyigoi'
// A trivial template that resizes images, just for example purposes.
//
// "steps": {
//   ":original": { "robot": "/upload/handle" },
//   "resize": {
//     "use": ":original",
//     "robot": "/image/resize",
//     "width": 100,
//     "height": 100,
//     "imagemagick_stack": "v1.0.0"
//   }
// }
const TEMPLATE_ID = '71ca4de9ac8443e2bb2245881d902a81'

/**
 * Form
 */

const formUppy = new Uppy({
  debug: true,
  autoProceed: true,
  restrictions: {
    allowedFileTypes: ['.png'],
  },
})
  .use(Dashboard, {
    trigger: '#uppy-select-files',
    closeAfterFinish: true,
    note: 'Only PNG files please!',
  })
  .use(RemoteSources, { companionUrl: COMPANION_URL })
  .use(Form, {
    target: '#test-form',
    fields: ['message'],
    // submitOnSuccess: true,
    addResultToForm: true,
  })
  .use(Transloadit, {
    waitForEncoding: true,
    assemblyOptions: {
      params: {
        auth: { key: TRANSLOADIT_KEY },
        template_id: TEMPLATE_ID,
      },
    },
  }).use(GoldenRetriever)

formUppy.on('error', (err) => {
  document.querySelector('#test-form .error').textContent = err.message
})

formUppy.on('upload-error', (file, err) => {
  document.querySelector('#test-form .error').textContent = err.message
})

formUppy.on('complete', ({ transloadit }) => {
  const btn = document.getElementById('uppy-select-files')
  btn.hidden = true
  const selectedFiles = document.getElementById('uppy-form-selected-files')
  selectedFiles.textContent = `selected files: ${Object.keys(transloadit[0].results).length}`
})

window.formUppy = formUppy

// ── GoldenRetriever recovery footprint (issue #6280) ────────────────────────
// Proves the recovery snapshot moved off localStorage: localStorage stays ~0
// while IndexedDB absorbs the (potentially multi-MB) Transloadit assembly state.
// Open the console and watch `IndexedDB` grow as you add files / processing runs.
const GR_STATE_KEY = formUppy.getID()
const kb = (n) => `${(n / 1024).toFixed(1)} KB`

const lsSnapshotBytes = () =>
  localStorage.getItem(`uppyState:${GR_STATE_KEY}`)?.length ?? 0

const idbSnapshotBytes = () =>
  new Promise((resolve) => {
    const req = indexedDB.open('uppy-blobs')
    req.onsuccess = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('state')) {
        db.close()
        return resolve(0)
      }
      const get = db.transaction('state').objectStore('state').get(GR_STATE_KEY)
      get.onsuccess = () => {
        resolve(get.result ? JSON.stringify(get.result.metadata).length : 0)
        db.close()
      }
      get.onerror = () => {
        db.close()
        resolve(0)
      }
    }
    req.onerror = () => resolve(0)
  })

async function logRecoveryFootprint(label) {
  const ls = lsSnapshotBytes()
  const idb = await idbSnapshotBytes()
  console.log(
    `[GR #6280] ${label}: files=${formUppy.getFiles().length} | localStorage=${kb(ls)} | IndexedDB=${kb(idb)}`,
  )
  if (idb > 5 * 1024 * 1024)
    console.warn(
      `[GR #6280] snapshot is ${kb(idb)} — past localStorage's ~5MB cap; IndexedDB is carrying it. Old code would have thrown QuotaExceededError here.`,
    )
}

console.log(
  `[GR #6280] snapshot backend: ${window.indexedDB ? 'IndexedDB' : 'localStorage'}`,
)
formUppy.on('file-added', () => logRecoveryFootprint('file-added'))
formUppy.on('restored', () => logRecoveryFootprint('restored'))
formUppy.on('transloadit:assembly-created', () =>
  logRecoveryFootprint('assembly-created'),
)
formUppy.on('complete', () => logRecoveryFootprint('complete'))
// assemblyResponse (uploads + per-step results) is what bloats the snapshot.
formUppy.on('restore:plugin-data-changed', (data) => {
  const ar = data?.Transloadit?.assemblyResponse
  if (ar) console.log(`[GR #6280] assemblyResponse=${kb(JSON.stringify(ar).length)}`)
})

/**
 * Form with Dashboard
 */

const formUppyWithDashboard = new Uppy({
  debug: true,
  autoProceed: false,
  restrictions: {
    allowedFileTypes: ['.png'],
  },
})
  .use(Dashboard, {
    inline: true,
    target: '#dashboard-form .dashboard',
    note: 'Only PNG files please!',
    hideUploadButton: true,
  })
  .use(RemoteSources, { companionUrl: COMPANION_URL })
  .use(Form, {
    target: '#dashboard-form',
    fields: ['message'],
    triggerUploadOnSubmit: true,
    submitOnSuccess: true,
    addResultToForm: true,
  })
  .use(Transloadit, {
    waitForEncoding: true,
    assemblyOptions: {
      params: {
        auth: { key: TRANSLOADIT_KEY },
        template_id: TEMPLATE_ID,
      },
    },
  })

window.formUppyWithDashboard = formUppyWithDashboard

/**
 * Dashboard
 */

const dashboard = new Uppy({
  debug: true,
  autoProceed: false,
  restrictions: {
    allowedFileTypes: ['.png', '.jpg', '.jpeg'],
  },
})
  .use(Dashboard, {
    inline: true,
    target: '#dashboard',
    note: 'Only PNG files please!',
  })
  .use(RemoteSources, { companionUrl: COMPANION_URL })
  .use(Webcam, { target: Dashboard })
  .use(ImageEditor, { target: Dashboard })
  .use(Transloadit, {
    waitForEncoding: true,
    assemblyOptions: {
      params: {
        auth: { key: TRANSLOADIT_KEY },
        template_id: TEMPLATE_ID,
      },
    },
  }).use(GoldenRetriever)

window.dashboard = dashboard

// /**
//  * Dashboard Modal
//  */

const dashboardModal = new Uppy({
  debug: true,
  autoProceed: false,
})
  .use(Dashboard, { closeAfterFinish: true })
  .use(RemoteSources, { companionUrl: COMPANION_URL })
  .use(Webcam, { target: Dashboard })
  .use(ImageEditor, { target: Dashboard })
  .use(Transloadit, {
    waitForEncoding: true,
    assemblyOptions: {
      params: {
        auth: { key: TRANSLOADIT_KEY },
        template_id: TEMPLATE_ID,
      },
    },
  })

dashboardModal.on('complete', ({ transloadit, successful, failed }) => {
  if (failed?.length !== 0) {
    console.error('it failed', failed)
  } else {
    console.log('success', { transloadit, successful })
  }
})

function openModal() {
  dashboardModal.getPlugin('Dashboard').openModal()
}

window.openModal = openModal

// /**
//  * uppy.upload (files come from input[type=file])
//  */

const uppyWithoutUI = new Uppy({
  debug: true,
  restrictions: {
    allowedFileTypes: ['.png'],
  },
}).use(Transloadit, {
  waitForEncoding: true,
  assemblyOptions: {
    params: {
      auth: { key: TRANSLOADIT_KEY },
      template_id: TEMPLATE_ID,
    },
  },
})

window.doUpload = (event) => {
  const resultEl = document.querySelector('#upload-result')
  const errorEl = document.querySelector('#upload-error')

  uppyWithoutUI.addFiles(event.target.files)
  uppyWithoutUI.upload()

  uppyWithoutUI.on('complete', ({ transloadit }) => {
    resultEl.classList.remove('hidden')
    errorEl.classList.add('hidden')
    resultEl.textContent = JSON.stringify(transloadit[0].results, null, 2)

    const resizedUrl = transloadit[0].results.resize[0].ssl_url
    const img = document.createElement('img')
    img.src = resizedUrl
    document.getElementById('upload-result-image').appendChild(img)
  })

  uppyWithoutUI.on('error', (err) => {
    resultEl.classList.add('hidden')
    errorEl.classList.remove('hidden')
    errorEl.textContent = err.message
  })
}
