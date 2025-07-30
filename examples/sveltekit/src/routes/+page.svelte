<script lang="ts">
import Uppy from '@uppy/core'
import UppyRemoteSources from '@uppy/remote-sources'
import UppyScreenCapture from '@uppy/screen-capture'
import {
  Dropzone,
  FilesGrid,
  FilesList,
  UploadButton,
  UppyContextProvider,
} from '@uppy/svelte'
import Tus from '@uppy/tus'
import UppyWebcam from '@uppy/webcam'
import '@uppy/svelte/css/style.css'

import CustomDropzone from '../components/CustomDropzone.svelte'
import RemoteSource from '../components/RemoteSource.svelte'
import ScreenCapture from '../components/ScreenCapture.svelte'
import Webcam from '../components/Webcam.svelte'

const uppy = new Uppy()
  .use(Tus, {
    endpoint: 'https://tusd.tusdemo.net/files/',
  })
  .use(UppyWebcam)
  .use(UppyScreenCapture)
  .use(UppyRemoteSources, { companionUrl: 'http://localhost:3020' })

let dialogRef: HTMLDialogElement
let modalPlugin = $state<'webcam' | 'dropbox' | 'screen-capture' | null>(null)

function openModal(plugin: 'webcam' | 'dropbox' | 'screen-capture') {
  modalPlugin = plugin
  dialogRef?.showModal()
}

function closeModal() {
  modalPlugin = null
  dialogRef?.close()
}
</script>

<UppyContextProvider {uppy}>
  <main class="p-5 max-w-xl mx-auto">
    <h1 class="text-4xl font-bold my-4">Welcome to SvelteKit.</h1>

    <UploadButton />

    <dialog
      bind:this={dialogRef}
      class="backdrop:bg-gray-500/50 rounded-lg shadow-xl p-0 fixed inset-0 m-auto"
    >
      {#if modalPlugin === 'webcam'}
        <Webcam close={closeModal} />
      {/if}
      {#if modalPlugin === 'dropbox'}
        <RemoteSource id="Dropbox" close={closeModal} />
      {/if}
      {#if modalPlugin === 'screen-capture'}
        <ScreenCapture close={closeModal} />
      {/if}
    </dialog>

    <article>
      <h2 class="text-2xl my-4">With list</h2>
      <Dropzone />
      <FilesList />
    </article>

    <article>
      <h2 class="text-2xl my-4">With grid</h2>
      <Dropzone />
      <FilesGrid columns={2} />
    </article>

    <article>
      <h2 class="text-2xl my-4">With custom dropzone</h2>
      <CustomDropzone {openModal} />
    </article>
  </main>
</UppyContextProvider>
