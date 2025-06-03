<script module lang="ts">
  import type Uppy from '@uppy/core'
  import { createUppyEventAdapter, type UploadStatus } from '@uppy/components'

  export const UppyContextKey = 'uppy-context'
  export const UppyStateKey = 'uppy-state'
  export type { UppyContext } from '@uppy/components'
</script>

<script lang="ts">
  import { setContext, onMount } from 'svelte'

  let { uppy, children } = $props()

  const state: { status: UploadStatus, progress: number } = $state({
    status: 'init',
    progress: 0,
  })

  onMount(() => {
    if (!uppy) {
      throw new Error('ContextProvider: passing `uppy` as a prop is required')
    }

    const uppyEventAdapter = createUppyEventAdapter({
      uppy,
      onStatusChange: (newStatus: UploadStatus) => {
        state.status = newStatus
      },
      onProgressChange: (newProgress: number) => {
        state.progress = newProgress
      },
    })

    return () => uppyEventAdapter.cleanup()
  })

  // Set the context for child components to use
  setContext(UppyContextKey, uppy)
  setContext(UppyStateKey, state)
</script>

{@render children()}
