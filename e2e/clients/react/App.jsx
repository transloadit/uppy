/** biome-ignore-all lint/nursery/useUniqueElementIds: it's fine */
import Uppy from '@uppy/core'
import { Dashboard, DashboardModal } from '@uppy/react'
import RemoteSources from '@uppy/remote-sources'
import ThumbnailGenerator from '@uppy/thumbnail-generator'
import React, { useState } from 'react'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const uppyDashboard = new Uppy({ id: 'dashboard' }).use(RemoteSources, {
  companionUrl: 'http://companion.uppy.io',
  sources: ['GoogleDrive', 'OneDrive', 'Unsplash', 'Zoom', 'Url'],
})
const uppyModal = new Uppy({ id: 'modal' })

export default function App() {
  const [open, setOpen] = useState(false)
  // TODO: Parcel is having a bad time resolving React inside @uppy/react for some reason.
  // We are using Parcel in an odd way and I don't think there is an easy fix.
  // const files = useUppyState(uppyDashboard, (state) => state.files)

  // window.uppy = uppyDashboard // (if you want to expose for tests)

  return (
    <div
      style={{
        maxWidth: '30em',
        margin: '5em 0',
        display: 'grid',
        gridGap: '2em',
      }}
    >
      <button type="button" id="open" onClick={() => setOpen(!open)}>
        Open Modal
      </button>
      {/* <p>Dashboard file count: {Object.keys(files).length}</p> */}

      <Dashboard id="dashboard" uppy={uppyDashboard} />
      <DashboardModal id="modal" open={open} uppy={uppyModal} />
    </div>
  )
}
