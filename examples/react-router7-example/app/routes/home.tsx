import { useState } from 'react'
import Uppy from '@uppy/core'
import { Dashboard } from '@uppy/react'
import Tus from '@uppy/tus'

function createUppy() {
  return new Uppy({
    debug: true,
    restrictions: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxNumberOfFiles: 10,
      allowedFileTypes: ['image/*', 'video/*', 'audio/*', '.pdf', '.txt', '.zip'],
    },
  }).use(Tus, {
    endpoint: '/api/upload',
    retryDelays: [0, 1000, 3000, 5000],
    removeFingerprintOnSuccess: true,
  })
}

export default function Home() {
  // Important: use an initializer function to prevent the state from recreating
  const [uppy] = useState(createUppy)

  return (
    <div className="container">
      <h1>React Router 7 + Uppy File Upload</h1>
      <p className="description">
        This example demonstrates how to integrate Uppy with React Router 7 using a custom Express server.
        The TUS protocol provides resumable uploads for reliable file handling.
      </p>

      <div className="uppy-section">
        <h2>TUS Resumable Upload</h2>
        <p>
          Upload files using the TUS protocol for resumable uploads. If your connection drops,
          the upload will automatically resume where it left off.
        </p>
        <Dashboard
          uppy={uppy}
          height={400}
          hideProgressDetails={false}
          showLinkToFileUploadResult={true}
          showRemoveButtonAfterComplete={true}
          note="Upload up to 10 files, max 100MB each. Files are saved to /uploads directory."
        />
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#f9f9f9', borderRadius: '4px' }}>
        <h3>How it works:</h3>
        <ol>
          <li><strong>Express Server:</strong> Custom server handles TUS uploads at <code>/api/upload</code></li>
          <li><strong>React Router:</strong> All other routes handled by React Router 7</li>
          <li><strong>TUS Protocol:</strong> Enables resumable uploads for large files</li>
          <li><strong>File Storage:</strong> Files saved to <code>/uploads</code> directory</li>
        </ol>
      </div>
    </div>
  )
}
