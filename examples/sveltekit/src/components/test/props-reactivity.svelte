<script lang="ts">
import Uppy from '@uppy/core'
import Dashboard from '@uppy/svelte/dashboard'
import StatusBar from '@uppy/svelte/status-bar'

import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'
import '@uppy/status-bar/css/style.css'

const uppy = new Uppy()
uppy.addFile(new File(['hello world'], 'hello.txt'))
let disabled = false
let hideUploadButton = false
</script>

<main class="p-5 max-w-xl mx-auto">
  <button onclick={() => (disabled = !disabled)}>Toggle dashboard</button>
  <Dashboard props={{disabled: disabled}} uppy={uppy} />
  <button onclick={() => (hideUploadButton = !hideUploadButton)}>Toggle statusbar</button>
  <div id="statusbar-container">
    <StatusBar props={{ hideUploadButton }} uppy={uppy} />
  </div>
</main>
