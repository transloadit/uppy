/* eslint-disable */
import React from 'react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import Webcam from '@uppy/webcam'
import RemoteSources from '@uppy/remote-sources'
import { Dashboard, useUppyState } from '@uppy/react'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import '@uppy/drag-drop/dist/style.css'
import '@uppy/file-input/dist/style.css'
import '@uppy/progress-bar/dist/style.css'

const metaFields = [
  { id: 'license', name: 'License', placeholder: 'specify license' },
]

function createUppy() {
  return new Uppy({ restrictions: { requiredMetaFields: ['license'] } })
    .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
    .use(Webcam)
    .use(RemoteSources, {
      companionUrl: 'https://companion.uppy.io',
    })
}

export default function App() {
  // IMPORTANT: passing an initaliser function to useState
  // to prevent creating a new Uppy instance on every render.
  // useMemo is a performance hint, not a guarantee.
  const [uppy] = React.useState(createUppy)
  // You can access state reactively with useUppyState
  const fileCount = useUppyState(
    uppy,
    (state) => Object.keys(state.files).length,
  )
  const totalProgress = useUppyState(uppy, (state) => state.totalProgress)
  // Also possible to get the state of all plugins.
  const plugins = useUppyState(uppy, (state) => state.plugins)

  return (
    <>
      <p>File count: {fileCount}</p>
      <p>Total progress: {totalProgress}</p>
      <Dashboard uppy={uppy} metaFields={metaFields} />
    </>
  )
}
