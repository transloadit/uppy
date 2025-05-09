/* eslint-disable react/button-has-type */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/react-in-jsx-scope */
import { useState } from 'react'
import {
  Dropzone,
  FilesGrid,
  FilesList,
  ProviderIcon,
  UploadButton,
  UppyContextProvider,
  useDropzone,
  useFileInput,
} from '@uppy/react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'

import './app.css'
import '@uppy/react/dist/styles.css'

function CustomDropzone() {
  const { getRootProps, getInputProps, isDragging } = useDropzone({
    noClick: true,
  })
  const { getButtonProps, getInputProps: getFileInputProps } = useFileInput()

  return (
    <div>
      <input {...getInputProps()} className="hidden" />
      <div
        {...getRootProps()}
        role="button"
        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors duration-200 ${isDragging ? 'bg-blue-50' : ''}`}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-3">
          <input {...getFileInputProps()} className="hidden" />
          <button
            {...getButtonProps()}
            className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
          >
            <div className="bg-white shadow-md rounded-md p-1">
              <ProviderIcon provider="device" fill="#02B383" />
            </div>
            Device
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [uppy] = useState(() =>
    new Uppy().use(Tus, {
      endpoint: 'https://tusd.tusdemo.net/files/',
    }),
  )

  return (
    <UppyContextProvider uppy={uppy}>
      <main className="p-5 max-w-xl mx-auto">
        <h1 className="text-4xl font-bold my-4">Welcome to React.</h1>

        <UploadButton />

        <article>
          <h2 className="text-2xl my-4">With list</h2>
          <Dropzone />
          <FilesList />
        </article>

        <article>
          <h2 className="text-2xl my-4">With grid</h2>
          <Dropzone />
          <FilesGrid columns={2} />
        </article>

        <article>
          <h2 className="text-2xl my-4">With custom dropzone</h2>
          <CustomDropzone />
        </article>
      </main>
    </UppyContextProvider>
  )
}

export default App
