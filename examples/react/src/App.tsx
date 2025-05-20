/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable react/button-has-type */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/react-in-jsx-scope */
import { useRef, useState } from 'react'
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

import './app.css'
import '@uppy/react/dist/styles.css'

function Webcam() {
  const {
    getVideoProps,
    getSnapshotButtonProps,
    getRecordButtonProps,
    getStopRecordingButtonProps,
    getSubmitButtonProps,
    getDiscardButtonProps,
  } = useWebcam()

  const ref = useRef<HTMLVideoElement>(null)

  return (
    <div className="">
      <video
        className="border-2 w-full"
        {...getVideoProps(ref.current)}
        ref={ref}
      />
      <div className="flex gap-4">
        <button className="disabled:opacity-50" {...getSnapshotButtonProps()}>
          Snapshot
        </button>
        <button className="disabled:opacity-50" {...getRecordButtonProps()}>
          Record
        </button>
        <button
          className="disabled:opacity-50"
          {...getStopRecordingButtonProps()}
        >
          Stop
        </button>
        <button className="disabled:opacity-50" {...getSubmitButtonProps()}>
          Submit
        </button>
        <button className="disabled:opacity-50" {...getDiscardButtonProps()}>
          Discard
        </button>
      </div>
    </div>
  )
}

function CustomDropzone() {
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
    new Uppy()
      .use(Tus, {
        endpoint: 'https://tusd.tusdemo.net/files/',
      })
      .use(UppyWebcam),
  )

  return (
    <UppyContextProvider uppy={uppy}>
      <main className="p-5 max-w-xl mx-auto">
        <h1 className="text-4xl font-bold my-4">Welcome to React.</h1>

        <UploadButton />

        <Webcam />

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
