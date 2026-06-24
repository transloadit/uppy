import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import GoldenRetriever from '@uppy/golden-retriever'
import Transloadit from '@uppy/transloadit'
import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'

const TRANSLOADIT_KEY = 'RsiWVN5IVqWNbSjPnk79p40TEHnyigoi'
// Swap for whichever template you're testing with.
const TEMPLATE_ID = '71ca4de9ac8443e2bb2245881d902a81'

const formUppy = new Uppy({ debug: true })
  .use(Dashboard, { inline: true, target: '#dashboard' })
  .use(Transloadit, {
    waitForEncoding: true,
    assemblyOptions: {
      params: {
        auth: { key: TRANSLOADIT_KEY },
        template_id: TEMPLATE_ID,
      },
    },
  })
  .use(GoldenRetriever)

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
// Surface *why* an assembly failed (the bare `[Uppy] Error` hides the reason).
formUppy.on('transloadit:assembly-error', (assembly, err) => {
  console.error('[GR #6280] assembly error:', err?.message, {
    error: assembly?.error,
    reason: assembly?.message ?? assembly?.reason,
    assembly_id: assembly?.assembly_id,
  })
})
// assemblyResponse (uploads + per-step results) is what bloats the snapshot.
formUppy.on('restore:plugin-data-changed', (data) => {
  const ar = data?.Transloadit?.assemblyResponse
  if (ar)
    console.log(`[GR #6280] assemblyResponse=${kb(JSON.stringify(ar).length)}`)
})
