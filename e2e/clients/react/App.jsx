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
const uppyDragDrop = new Uppy({ id: 'drag-drop' }).use(ThumbnailGenerator)

function CustomDropzone({ uppy }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => uppy.addFile({
      name: file.name,
      type: file.type,
      data: file,
      source: 'Local',
      isRemote: false,
    }))
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => uppy.addFile({
      name: file.name,
      type: file.type,
      data: file,
      source: 'Local',
      isRemote: false,
    }))
  }

  return (
    <div
      id="drag-drop"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
      }}
    >
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="file-input"
      />
      <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
        <p>Drag and drop files here, or click to select files</p>
        {isDragging && <p style={{ color: '#007acc' }}>Drop files here...</p>}
      </label>
    </div>
  )
}

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
      <CustomDropzone uppy={uppyDragDrop} />
    </div>
  )
}
