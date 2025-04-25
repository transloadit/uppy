/* eslint-disable react/react-in-jsx-scope */
import React, { useState } from 'react'
import {
  Dropzone,
  FilesGrid,
  FilesList,
  UploadButton,
  UppyContextProvider,
} from '@uppy/react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'

import './app.css'
import '@uppy/react/dist/styles.css'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
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
      <main style={{ padding: '20px', maxWidth: '32em', margin: '0 auto' }}>
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
