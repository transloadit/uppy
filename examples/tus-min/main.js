import Uppy from '@uppy/core'
import Tus from '@uppy/tus'

const TUS_ENDPOINT = 'http://localhost:1080/files/'

const logEl = document.querySelector('#log')
function log(label, data) {
  console.log(label, data)
  const pre = document.createElement('pre')
  pre.textContent =
    data === undefined ? label : `${label}\n${JSON.stringify(data, null, 2)}`
  logEl.prepend(pre)
}

// Inspect the parts of `response` that the bug affects. `response.body.xhr` is
// an XMLHttpRequest, so we read its `status`/`responseText` rather than dumping
// the object.
function describeResponse(response) {
  if (response === undefined) return '⚠️ response is undefined'
  const xhr = response.body?.xhr
  return {
    status: response.status,
    'body.xhr.status': xhr?.status,
    'body.xhr.responseText': xhr?.responseText,
  }
}

// Only the Tus uploader — no Dashboard, no providers, no Companion.
const uppy = new Uppy({ autoProceed: true, debug: true }).use(Tus, {
  endpoint: TUS_ENDPOINT,
})

uppy.on('upload-success', (file, response) => {
  // BUG (success path): on a build without the fix, `body.xhr.status` is 0
  // because the completed request was aborted during cleanup.
  log('✅ upload-success', describeResponse(response))
})

uppy.on('upload-error', (file, error, response) => {
  // BUG (#6287): on a build without the fix, `response` is `undefined`.
  log('❌ upload-error', describeResponse(response))
  log('   error.message', error.message)
})

uppy.on('complete', (result) => {
  const failed = result.failed?.[0]
  log('🏁 complete — failed[0].response', failed ? describeResponse(failed.response) : '(none failed)')
})

document.querySelector('#file').addEventListener('change', (event) => {
  const input = event.target
  for (const file of input.files) {
    try {
      uppy.addFile({ name: file.name, type: file.type, data: file })
    } catch (err) {
      log('addFile error', err.message)
    }
  }
  input.value = ''
})

// Handy for poking at state from the devtools console.
window.uppy = uppy
