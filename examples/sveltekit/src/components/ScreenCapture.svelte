<script lang="ts">
  import { onDestroy, untrack } from 'svelte'
  import { useScreenCapture } from '@uppy/svelte'

  interface Props {
    isOpen: boolean
    close: () => void
  }

  const { isOpen, close }: Props = $props()
  const screenCaptureStore = useScreenCapture({ onSubmit: close })

  $effect(() => {
    if (isOpen) {
      // Use untrack to not trigger the effect again
      untrack(() => screenCaptureStore.start())
    } else {
      untrack(() => screenCaptureStore.stop())
    }
  })

  onDestroy(() => {
    untrack(() => screenCaptureStore.stop())
  })
</script>


<div class="p-4 max-w-lg w-full">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-bold">Screen Capture</h2>
    <button onclick={close} class="text-gray-500 hover:text-gray-700">
      ✕
    </button>
  </div>
  <video
    class="border-2 w-full rounded-lg"
    {...screenCaptureStore.getMediaProps()}
  ></video>
  <div class="flex flex-wrap gap-2.5 mt-4">
    <button
      class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
      {...screenCaptureStore.getScreenshotButtonProps()}
    >
      Screenshot
    </button>
    <button
      class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
      {...screenCaptureStore.getRecordButtonProps()}
    >
      Record
    </button>
    <button
      class="bg-red-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-red-300"
      {...screenCaptureStore.getStopRecordingButtonProps()}
    >
      Stop
    </button>
    <button
      class="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-green-300"
      {...screenCaptureStore.getSubmitButtonProps()}
    >
      Submit
    </button>
    <button
      class="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-gray-300"
      {...screenCaptureStore.getDiscardButtonProps()}
    >
      Discard
    </button>
  </div>
</div>
