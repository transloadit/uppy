'use client'

import { useState } from 'react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import { Dashboard } from '@uppy/react'
import Xhr from '@uppy/xhr-upload'


import '@uppy/core/css/style.min.css'
import '@uppy/dashboard/css/style.min.css'
import '@uppy/webcam/css/style.min.css'

const UppyDashboard: React.FC = () => {
  const [uppy] = useState(() =>
    new Uppy({
      debug: true,
      restrictions: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxNumberOfFiles: 10,
        allowedFileTypes: ['image/*', 'video/*', 'audio/*', '.pdf', '.txt', '.zip', '.rar'],
      },
    }).use(Tus, {
      endpoint: '/api/tus',
      retryDelays: [0, 1000, 3000, 5000],
      removeFingerprintOnSuccess: true,
    })
  )
  const [uppyXhr] = useState(() =>
    new Uppy({
      debug: true,
      restrictions: {
        maxFileSize: 10 * 1024 * 1024, // 10MB for XHR
        maxNumberOfFiles: 5,
      },
    }).use(Xhr, { endpoint: '/api/xhr' })
  )


  return (
    <div className="uppy-container">
      <h2>TUS Resumable Upload Example</h2>
      <p>Supports large files with resume capability. Upload will continue even if connection is lost.</p>
      <Dashboard
        uppy={uppy}
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
    </div>
  )
}

export default UppyDashboard