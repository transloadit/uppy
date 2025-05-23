/* eslint-disable react/react-in-jsx-scope */
import { useState } from 'react'
import {
  Dropzone,
  FilesGrid,
  FilesList,
  UploadButton,
  UppyContextProvider,
} from '@uppy/react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'

import './app.css'
import '@uppy/react/dist/styles.css'

function App() {
  const [uppy] = useState(() =>
    new Uppy().use(Tus, {
      endpoint: 'https://tusd.tusdemo.net/files/',
    }),
  )

  return (
    <UppyContextProvider uppy={uppy}>
      <main className="p-5 max-w-xl mx-auto">
        <h1 className="text-4xl font-bold">Welcome to React.</h1>

        <article>
          <h2 className="text-2xl my-4">With list</h2>
          <Dropzone />

          <FilesList />
          <UploadButton />
        </article>

        <article>
          <h2 className="text-2xl my-4">With grid</h2>
          <Dropzone />
          <FilesGrid columns={2} />
          <UploadButton />
        </article>
      </main>
    </UppyContextProvider>
  )
}

export default App
