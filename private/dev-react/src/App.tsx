/* eslint-disable react/react-in-jsx-scope */
import React, { useState } from 'react'
import {
  Audio,
  Dropzone,
  NewFileInput,
  FilesGrid,
  FilesList,
  ImageEditor,
  ProviderIcon,
  ScreenCapture,
  UploadButton,
  UppyContextProvider,
  Webcam,
} from '@uppy/react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import Uppy, { type Meta, type Body, type UppyFile } from '@uppy/core'
import Tus from '@uppy/tus'

import './app.css'
import '@uppy/react/dist/styles.css'

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
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isScreenCaptureOpen, setIsScreenCaptureOpen] = useState(false)
  const [isAudioOpen, setIsAudioOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<
    UppyFile<Meta, Body> | undefined
  >()
  const [uppy] = useState(() =>
    new Uppy().use(Tus, {
      endpoint: 'https://tusd.tusdemo.net/files/',
    }),
  )

  return (
    <UppyContextProvider uppy={uppy}>
      <main style={{ padding: '20px', maxWidth: '32em', margin: '0 auto' }}>
        <h1 className="text-4xl font-bold">Welcome to React.</h1>

        <NewFileInput>
          <p>Hello</p>
        </NewFileInput>

        <Modal
          open={isImageEditorOpen}
          onClose={() => {
            setIsImageEditorOpen(false)
            setSelectedFile(undefined)
          }}
        >
          <ImageEditor
            file={selectedFile}
            child={() => (
              <button
                type="button"
                className="bg-blue-500 hover:bg-blue-600 transition-colors text-white p-2 rounded-b-md w-full"
                onClick={() => {
                  // @ts-expect-error ...
                  uppy.getPlugin('ImageEditor')?.save()
                  setIsImageEditorOpen(false)
                  setSelectedFile(undefined)
                }}
              >
                Save
              </button>
            )}
            onSave={() => {
              setIsImageEditorOpen(false)
              setSelectedFile(undefined)
            }}
            cropperOptions={{
              background: true,
              croppedCanvasOptions: {
                minWidth: 500,
                minHeight: 500,
              },
            }}
          />
        </Modal>

        <Modal open={isCameraOpen} onClose={() => setIsCameraOpen(false)}>
          <div className="bg-gray-200">
            <Webcam />
          </div>
        </Modal>

        <Modal
          open={isScreenCaptureOpen}
          onClose={() => setIsScreenCaptureOpen(false)}
        >
          <div className="bg-gray-200">
            <ScreenCapture />
          </div>
        </Modal>

        <Modal open={isAudioOpen} onClose={() => setIsAudioOpen(false)}>
          <div className="bg-gray-200">
            <Audio />
          </div>
        </Modal>

        <article>
          <h2 className="text-2xl my-4">With list</h2>
          <Dropzone
            noClick
            child={() => (
              <div className="flex items-center gap-4">
                <NewFileInput
                  className="hover:bg-gray-100 transition-colors p-2 rounded-md"
                  child={() => (
                    <div className="flex flex-col items-center gap-2 text-sm">
                      <div className="bg-white shadow-md rounded-md p-1">
                        <ProviderIcon provider="device" fill="#02B383" />
                      </div>
                      My Device
                    </div>
                  )}
                />
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(!isCameraOpen)}
                  className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
                >
                  <div className="bg-white shadow-md rounded-md p-1">
                    <ProviderIcon provider="camera" fill="#02B383" />
                  </div>
                  Camera
                </button>

                <button
                  type="button"
                  onClick={() => setIsScreenCaptureOpen(!isScreenCaptureOpen)}
                  className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
                >
                  <div className="bg-white shadow-md rounded-md p-1">
                    <ProviderIcon provider="screen-capture" fill="#02B383" />
                  </div>
                  Screencast
                </button>

                <button
                  type="button"
                  onClick={() => setIsAudioOpen(!isAudioOpen)}
                  className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
                >
                  <div className="bg-white shadow-md rounded-md p-1">
                    <ProviderIcon provider="audio" fill="#02B383" />
                  </div>
                  Audio
                </button>
              </div>
            )}
          />

          <FilesList
            editFile={(file) => {
              setSelectedFile(file)
              setIsImageEditorOpen(true)
            }}
          />
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
