<script module lang="ts">
import {
	createUppyEventAdapter,
	type UploadStatus,
	type UppyContext,
} from "@uppy/components";

export const UppyContextKey = "uppy-context";
export type { UppyContext } from "@uppy/components";
</script>

<script lang="ts">
  import { setContext, onMount } from 'svelte'

  let { uppy, children } = $props()

  // Create a single reactive context object
  const contextValue: UppyContext = $state({
    uppy,
    status: 'init' as UploadStatus,
    progress: 0,
  })

  onMount(() => {
    if (!uppy) {
      throw new Error('ContextProvider: passing `uppy` as a prop is required')
    }

    const uppyEventAdapter = createUppyEventAdapter({
      uppy,
      onStatusChange: (newStatus: UploadStatus) => {
        contextValue.status = newStatus
      },
      onProgressChange: (newProgress: number) => {
        contextValue.progress = newProgress
      },
    })

    return () => uppyEventAdapter.cleanup()
  })

  // Set the single context for child components to use
  setContext(UppyContextKey, contextValue)
</script>

{@render children()}
