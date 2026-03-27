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

  // Create reactive state for properties of the context
  let status = $state('init' as UploadStatus)
  let progress = $state(0)

  // Create a single context object, with some reactive properties
  const contextValue: UppyContext = {
    get uppy() { return uppy },
    get status() { return status },
    set status(value) { status = value },
    get progress() { return progress },
    set progress(value) { progress = value },
  }

  onMount(() => {
    if (!uppy) {
      throw new Error('ContextProvider: passing `uppy` as a prop is required')
    }

    const uppyEventAdapter = createUppyEventAdapter({
      uppy,
      onStatusChange: (newStatus: UploadStatus) => {
        status = newStatus
      },
      onProgressChange: (newProgress: number) => {
        progress = newProgress
      },
    })

    return () => uppyEventAdapter.cleanup()
  })

  // Set the single context for child components to use
  setContext(UppyContextKey, contextValue)
</script>

{@render children()}
