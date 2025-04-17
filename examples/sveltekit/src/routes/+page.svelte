<script lang="ts">
  import Uppy from '@uppy/core'
  import { UppyContextProvider, NewDragDrop, FilesList } from '@uppy/svelte'

  import '@uppy/components/dist/styles.css'

  const uppy = new Uppy()
</script>

<main class="mx-auto my-12 max-w-2xl">
  <h1>Welcome to SvelteKit</h1>
  <UppyContextProvider {uppy}>
    <NewDragDrop />
    <FilesList />
  </UppyContextProvider>
</main>
