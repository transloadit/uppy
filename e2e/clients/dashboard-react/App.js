/* eslint-disable react/react-in-jsx-scope */
import Uppy from '@uppy/core'
// eslint-disable-next-line no-unused-vars
import React from 'react'
import { Dashboard } from '@uppy/react'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

export default App

function App () {
  // Ideally we test with the `useUppy` hook,
  // as that's how it should be used.
  // But that results in breaking the rules of hooks errors?
  const uppy = new Uppy()

  return <Dashboard uppy={uppy} />
}
