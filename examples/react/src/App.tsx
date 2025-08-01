/** biome-ignore-all lint/nursery/useUniqueElementIds: it's fine */
import Uppy from '@uppy/core'
import {
  Dropzone,
  FilesGrid,
  FilesList,
  UploadButton,
  UppyContextProvider,
} from '@uppy/react'
import UppyRemoteSources from '@uppy/remote-sources'
import UppyScreenCapture from '@uppy/screen-capture'
import Tus from '@uppy/tus'
import UppyWebcam from '@uppy/webcam'
import { useRef, useState } from 'react'
import CustomDropzone from './CustomDropzone'
import { RemoteSource } from './RemoteSource'
import ScreenCapture from './ScreenCapture'
import Webcam from './Webcam'

import './app.css'
import '@uppy/react/css/style.css'

function App() {
  const [uppy] = useState(() =>
    new Uppy()
      .use(Tus, {
        endpoint: 'https://tusd.tusdemo.net/files/',
      })
      .use(UppyWebcam)
      .use(UppyScreenCapture)
      .use(UppyRemoteSources, { companionUrl: 'http://localhost:3020' }),
  )

  const dialogRef = useRef<HTMLDialogElement>(null)
  const [modalPlugin, setModalPlugin] = useState<
    'webcam' | 'dropbox' | 'screen-capture' | null
  >(null)

  function openModal(plugin: 'webcam' | 'dropbox' | 'screen-capture') {
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
          {(() => {
            switch (modalPlugin) {
              case 'webcam':
                return <Webcam close={() => closeModal()} />
              case 'dropbox':
                return <RemoteSource id="Dropbox" close={() => closeModal()} />
              case 'screen-capture':
                return <ScreenCapture close={() => closeModal()} />
              default:
                return null
            }
          })()}
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
