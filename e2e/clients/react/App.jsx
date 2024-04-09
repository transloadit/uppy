/* eslint-disable react/react-in-jsx-scope */
import Uppy from '@uppy/core'
/* eslint-disable-next-line no-unused-vars */
import React, { useState } from 'react'
import { Dashboard, DashboardModal, DragDrop } from '@uppy/react'
import ThumbnailGenerator from '@uppy/thumbnail-generator'
import RemoteSources from '@uppy/remote-sources'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import '@uppy/drag-drop/dist/style.css'

const uppyDashboard = new Uppy({ id: 'dashboard' }).use(RemoteSources, {
  companionUrl: 'http://companion.uppy.io',
  sources: ['GoogleDrive', 'OneDrive', 'Unsplash', 'Zoom', 'Url'],
})
const uppyModal = new Uppy({ id: 'modal' })
const uppyDragDrop = new Uppy({ id: 'drag-drop' }).use(ThumbnailGenerator)

export default function App() {
  const [open, setOpen] = useState(false)
  // TODO: Parcel is having a bad time resolving React inside @uppy/react for some reason.
  // We are using Parcel in an odd way and I don't think there is an easy fix.
  // const files = useUppyState(uppyDashboard, (state) => state.files)

  // drag-drop has no visual output so we test it via the uppy instance
  window.uppy = uppyDragDrop

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
      <DragDrop id="drag-drop" uppy={uppyDragDrop} />
    </div>
  )
}
