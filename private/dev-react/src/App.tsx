/* eslint-disable max-len */
/* eslint-disable react/button-has-type */
/* eslint-disable react/react-in-jsx-scope */
import React, { useState } from 'react'
// import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import {
  UppyContextProvider,
  UploadButton,
  FilesList,
  Dropzone,
} from '@uppy/react'

import './app.css'
// eslint-disable-next-line import/no-extraneous-dependencies
import '@uppy/components/dist/styles.css'

// function Modal({ open, onClose, children }) {
//   return (
//     <Dialog open={open} onClose={onClose} className="relative z-10">
//       <DialogBackdrop
//         transition
//         className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
//       />
//
//       <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
//         <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
//           <DialogPanel
//             transition
//             className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
//           >
//             {children}
//           </DialogPanel>
//         </div>
//       </div>
//     </Dialog>
//   )
// }

function App() {
  // const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)
  // const [isCameraOpen, setIsCameraOpen] = useState(false)
  // const [isScreenCaptureOpen, setIsScreenCaptureOpen] = useState(false)
  // const [isAudioOpen, setIsAudioOpen] = useState(false)
  // const [selectedFile, setSelectedFile] = useState(null)
  const [uppy] = useState(() =>
    new Uppy().use(Tus, {
      endpoint: 'https://tusd.tusdemo.net/files/',
    }),
  )

  return (
    <UppyContextProvider uppy={uppy}>
      <main style={{ padding: '20px', maxWidth: '32em', margin: '0 auto' }}>
        <h1 className="text-4xl font-bold">Welcome to React.</h1>

        <Dropzone />
        <FilesList item={(file) => <div>{file.name}</div>} />
        <UploadButton />
      </main>
    </UppyContextProvider>
  )
}

export default App
