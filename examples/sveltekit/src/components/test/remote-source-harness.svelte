<script lang="ts">
import type Uppy from '@uppy/core'
import { UppyContextProvider } from '@uppy/svelte'
import RemoteSource from '../RemoteSource.svelte'

const { uppy, close }: { uppy: Uppy<any, any>; close: () => void } = $props()
</script>

<UppyContextProvider {uppy}>
  <RemoteSource id="Dropbox" {close} />
</UppyContextProvider>
