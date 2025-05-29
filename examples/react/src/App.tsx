/* eslint-disable no-shadow */
/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable react/button-has-type */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useState, useRef } from 'react'
import {
  Dropzone,
  FilesGrid,
  FilesList,
  ProviderIcon,
  UploadButton,
  UppyContextProvider,
  useWebcam,
  useDropzone,
  useFileInput,
} from '@uppy/react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import UppyWebcam from '@uppy/webcam'
import UppyRemoteSources from '@uppy/remote-sources'

import { Dropbox } from './Dropbox.js'

import './app.css'
import '@uppy/react/dist/styles.css'

interface WebcamProps {
  close: () => void
}

function Webcam({ close }: WebcamProps) {
  const {
    start,
    stop,
    getVideoProps,
    getSnapshotButtonProps,
    getRecordButtonProps,
    getStopRecordingButtonProps,
    getSubmitButtonProps,
    getDiscardButtonProps,
  } = useWebcam({ onSubmit: close })

  useEffect(() => {
    start()

    return () => {
      stop()
    }
  }, [start, stop])

  return (
    <div className="p-4 max-w-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Camera</h2>
        <button onClick={close} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
      <video
        className="border-2 w-full rounded-lg data-[uppy-mirrored=true]:scale-x-[-1]"
        {...getVideoProps()}
      />
      <div className="flex gap-4 mt-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
          {...getSnapshotButtonProps()}
        >
          Snapshot
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
          {...getRecordButtonProps()}
        >
          Record
        </button>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-red-300"
          {...getStopRecordingButtonProps()}
        >
          Stop
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-green-300"
          {...getSubmitButtonProps()}
        >
          Submit
        </button>
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-gray-300"
          {...getDiscardButtonProps()}
        >
          Discard
        </button>
      </div>
    </div>
  )
}

interface CustomDropzoneProps {
  openModal: (plugin: 'webcam' | 'dropbox') => void
}

function CustomDropzone({ openModal }: CustomDropzoneProps) {
  const { getRootProps, getInputProps } = useDropzone({
    noClick: true,
  })
  const { getButtonProps, getInputProps: getFileInputProps } = useFileInput()

  return (
    <div>
      <input {...getInputProps()} className="hidden" />
      <div
        {...getRootProps()}
        role="button"
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center justify-center gap-4">
          <input {...getFileInputProps()} className="hidden" />
          <button
            {...getButtonProps()}
            className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
          >
            <div className="bg-white shadow-md rounded-md p-1">
              <ProviderIcon provider="device" fill="#1269cf" />
            </div>
            Device
          </button>

          <button
            type="button"
            onClick={() => openModal('webcam')}
            className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
          >
            <div className="bg-white shadow-md rounded-md p-1">
              <ProviderIcon provider="camera" fill="#02B383" />
            </div>
            Webcam
          </button>

          <button
            type="button"
            onClick={() => openModal('dropbox')}
            className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
          >
            <div className="bg-white shadow-md rounded-md p-1">
              <ProviderIcon provider="dropbox" />
            </div>
            Dropbox
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [uppy] = useState(() =>
    new Uppy()
      .use(Tus, {
        endpoint: 'https://tusd.tusdemo.net/files/',
      })
      .use(UppyWebcam)
      .use(UppyRemoteSources, { companionUrl: 'http://localhost:3020' }),
  )

  const dialogRef = useRef<HTMLDialogElement>(null)
  const [modalPlugin, setModalPlugin] = useState<'webcam' | 'dropbox' | null>(
    null,
  )

  function openModal(plugin: 'webcam' | 'dropbox') {
    setModalPlugin(plugin)
    dialogRef.current?.showModal()
  }

  function closeModal() {
    setModalPlugin(null)
    dialogRef.current?.close()
  }

  return (
    <UppyContextProvider uppy={uppy}>
      <main className="p-5 max-w-xl mx-auto">
        <h1 className="text-4xl font-bold my-4">Welcome to React.</h1>

        <UploadButton />

        <dialog
          ref={dialogRef}
          className="backdrop:bg-gray-500/50 rounded-lg shadow-xl p-0 fixed inset-0 m-auto"
        >
          {modalPlugin === 'webcam' && <Webcam close={() => closeModal()} />}
          {modalPlugin === 'dropbox' && <Dropbox close={() => closeModal()} />}
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
          <CustomDropzone openModal={(plugin) => openModal(plugin)} />
        </article>
      </main>
    </UppyContextProvider>
  )
}

export default App
