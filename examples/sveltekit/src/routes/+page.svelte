<script lang="ts">
  import Uppy from '@uppy/core'
  import Tus from '@uppy/tus'
  import {
    UppyContextProvider,
    Dropzone,
    FilesList,
    FilesGrid,
    UploadButton,
  } from '@uppy/svelte'
  import '@uppy/svelte/dist/styles.css'

  const uppy = new Uppy().use(Tus, {
    endpoint: 'https://tusd.tusdemo.net/files/',
  })
</script>

<UppyContextProvider {uppy}>
  <main class="p-5 max-w-xl mx-auto">
    <h1 class="text-4xl font-bold">Welcome to SvelteKit.</h1>

    <article>
      <h2 class="text-2xl my-4">With list</h2>
      <Dropzone />
      <FilesList />
      <UploadButton />
    </article>

    <article>
      <h2 class="text-2xl my-4">With grid</h2>
      <Dropzone />
      <FilesGrid columns={2} />
      <UploadButton />
    </article>
  </main>
</UppyContextProvider>
