/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable react/button-has-type */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/react-in-jsx-scope */
import React, { useState, useRef } from 'react'
import {
  Dropzone,
  FilesGrid,
  FilesList,
  UploadButton,
  UppyContextProvider,
} from '@uppy/react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import UppyWebcam from '@uppy/webcam'
import UppyScreenCapture from '@uppy/screen-capture'
import Webcam from './Webcam.tsx'
import ScreenCapture from './ScreenCapture.tsx'
import CustomDropzone from './CustomDropzone.tsx'

import './app.css'
import '@uppy/react/dist/styles.css'

function App() {
  const [uppy] = useState(() =>
    new Uppy()
      .use(Tus, {
        endpoint: 'https://tusd.tusdemo.net/files/',
      })
      .use(UppyScreenCapture, {
        preferredVideoMimeType: 'video/webm',
        displayMediaConstraints: {
          video: {
            width: 1280,
            height: 720,
            frameRate: {
              ideal: 3,
              max: 5,
            },
          },
          audio: false,
        },
        enableScreenshots: true,
        preferredImageMimeType: 'image/webp',
      })
      .use(UppyWebcam),
  )

  const webcamDialogRef = useRef<HTMLDialogElement>(null)
  const screenCaptureDialogRef = useRef<HTMLDialogElement>(null)
  const [isWebcamOpen, setIsWebcamOpen] = useState(false)
  const [isScreenCaptureOpen, setIsScreenCaptureOpen] = useState(false)

  function openWebcamModal() {
    setIsWebcamOpen(true)
    webcamDialogRef.current?.showModal()
  }

  function closeWebcamModal() {
    setIsWebcamOpen(false)
    webcamDialogRef.current?.close()
  }

  function openScreenCaptureModal() {
    setIsScreenCaptureOpen(true)
    screenCaptureDialogRef.current?.showModal()
  }

  function closeScreenCaptureModal() {
    setIsScreenCaptureOpen(false)
    screenCaptureDialogRef.current?.close()
  }

  return (
    <UppyContextProvider uppy={uppy}>
      <main className="p-5 max-w-xl mx-auto">
        <h1 className="text-4xl font-bold my-4">Welcome to React.</h1>

        <UploadButton />

        <dialog
          ref={webcamDialogRef}
          className="backdrop:bg-gray-500/50 rounded-lg shadow-xl p-0 fixed inset-0 m-auto"
        >
          <Webcam isOpen={isWebcamOpen} close={() => closeWebcamModal()} />
        </dialog>

        <dialog
          ref={screenCaptureDialogRef}
          className="backdrop:bg-gray-500/50 rounded-lg shadow-xl p-0 fixed inset-0 m-auto"
        >
          <ScreenCapture
            isOpen={isScreenCaptureOpen}
            close={() => closeScreenCaptureModal()}
          />
        </dialog>

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
          <CustomDropzone
            openWebcamModal={() => openWebcamModal()}
            openScreenCaptureModal={() => openScreenCaptureModal()}
          />
          <FilesList />
        </article>
      </main>
    </UppyContextProvider>
  )
}

export default App
