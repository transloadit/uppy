<script lang="ts">
import type Uppy from '@uppy/core'
import type { UppyFile } from '@uppy/core'
import { Thumbnail, UppyContextProvider } from '@uppy/svelte'

let { uppy, file }: { uppy: Uppy; file: UppyFile<any, any> } = $props()
let shown = $state(true)
</script>

<button type="button" onclick={() => (shown = !shown)}>Toggle thumbnail</button>
<UppyContextProvider {uppy}>
  {#if shown}
    <Thumbnail {file} images />
  {/if}
</UppyContextProvider>
