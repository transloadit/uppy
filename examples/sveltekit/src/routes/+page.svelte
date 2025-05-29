<script lang="ts">
  import Uppy from '@uppy/core'
  import Tus from '@uppy/tus'
  import UppyWebcam from '@uppy/webcam'
  import {
    UppyContextProvider,
    Dropzone,
    FilesList,
    FilesGrid,
    UploadButton,
  } from '@uppy/svelte'
  import '@uppy/svelte/dist/styles.css'

  import CustomDropzone from '../components/CustomDropzone.svelte'
  import Webcam from '../components/Webcam.svelte'

  const uppy = new Uppy()
    .use(Tus, {
      endpoint: 'https://tusd.tusdemo.net/files/',
    })
    .use(UppyWebcam)

  let webcamDialogRef: HTMLDialogElement
  let isWebcamOpen = $state(false)

  function openWebcamModal() {
    isWebcamOpen = true
    webcamDialogRef?.showModal()
  }

  function closeWebcamModal() {
    isWebcamOpen = false
    webcamDialogRef?.close()
  }
</script>

<UppyContextProvider {uppy}>
  <main class="p-5 max-w-xl mx-auto">
    <h1 class="text-4xl font-bold my-4">Welcome to SvelteKit.</h1>

    <UploadButton />

    <dialog
      bind:this={webcamDialogRef}
      class="backdrop:bg-gray-500/50 rounded-lg shadow-xl p-0 fixed inset-0 m-auto"
    >
      <Webcam isOpen={isWebcamOpen} close={closeWebcamModal} />
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
      <CustomDropzone {openWebcamModal} />
    </article>
  </main>
</UppyContextProvider>
