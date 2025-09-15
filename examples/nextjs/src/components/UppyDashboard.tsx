'use client'

import Uppy from '@uppy/core'
import { Dashboard } from '@uppy/react'
import Transloadit from '@uppy/transloadit'
import Tus from '@uppy/tus'
import Xhr from '@uppy/xhr-upload'
import { useState } from 'react'

import '@uppy/core/css/style.min.css'
import '@uppy/dashboard/css/style.min.css'
import '@uppy/webcam/css/style.min.css'

const UppyDashboard = () => {
  const [uppyTus] = useState(() =>
    new Uppy({
      debug: true,
      restrictions: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxNumberOfFiles: 10,
        allowedFileTypes: [
          'image/*',
          'video/*',
          'audio/*',
          '.pdf',
          '.txt',
          '.zip',
          '.rar',
        ],
      },
    }).use(Tus, {
      endpoint: '/api/tus',
      retryDelays: [0, 1000, 3000, 5000],
      removeFingerprintOnSuccess: true,
    }),
  )
  const [uppyXhr] = useState(() =>
    new Uppy({
      debug: true,
      restrictions: {
        maxFileSize: 10 * 1024 * 1024, // 10MB for XHR
        maxNumberOfFiles: 5,
      },
    }).use(Xhr, { endpoint: '/api/xhr' }),
  )

  const [uppyTransloadit] = useState(() => {
    const uppyInstance = new Uppy({
      debug: true,
      restrictions: {
        maxFileSize: 200 * 1024 * 1024, // 200MB for Transloadit
        maxNumberOfFiles: 10,
        allowedFileTypes: ['image/*', 'video/*', 'audio/*'],
      },
    })

    return uppyInstance.use(Transloadit, {
      async assemblyOptions() {
        // Send optional metadata
        const { meta }: { meta: Record<string, unknown> } =
          uppyInstance.getState()
        const body: string = JSON.stringify({
          customValue: meta.customValue || 'nextjs-transloadit-example',
        })

        const res: Response = await fetch('/api/transloadit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        })

        if (!res.ok) {
          throw new Error(
            `Failed to get Transloadit signature: ${res.statusText}`,
          )
        }

        return res.json() // { params, signature, expires }
      },
    })
  })

  return (
    <div className="uppy-container">
      <h2>TUS Resumable Upload Example</h2>
      <p>
        Supports large files with resume capability. Upload will continue even
        if connection is lost.
      </p>
      <Dashboard
        uppy={uppyTus}
        height={400}
        hideProgressDetails={false}
        showLinkToFileUploadResult={true}
        showRemoveButtonAfterComplete={true}
        note="Upload up to 10 files, max 100MB each"
      />

      <h2>XHR Upload Example</h2>
      <p>Traditional HTTP upload for smaller files.</p>
      <Dashboard
        uppy={uppyXhr}
        height={300}
        hideProgressDetails={false}
        note="Upload up to 5 files, max 10MB each"
      />

      <h2>Transloadit Upload Example</h2>
      <p>
        Upload with automatic processing (resize, thumbnails, format
        conversion).
      </p>
      <Dashboard
        uppy={uppyTransloadit}
        height={400}
        hideProgressDetails={false}
        showLinkToFileUploadResult={true}
        showRemoveButtonAfterComplete={true}
        note="Upload media files for automatic processing (max 200MB each)"
      />
    </div>
  )
}

export default UppyDashboard
