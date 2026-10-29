<script lang="ts">
import Uppy from '@uppy/core'
import { Thumbnail, UppyContextProvider } from '@uppy/svelte'

const uppy = new Uppy()
const file = uppy.getFile(
  uppy.addFile({
    name: 'cat.png',
    type: 'image/png',
    data: new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
  }),
)
let shown = $state(true)
</script>

<button type="button" onclick={() => (shown = !shown)}>Toggle thumbnail</button>
<UppyContextProvider {uppy}>
  {#if shown}
    <Thumbnail {file} images />
  {/if}
</UppyContextProvider>
