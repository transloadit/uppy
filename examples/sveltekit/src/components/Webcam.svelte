<script lang="ts">
  import { onDestroy, untrack } from 'svelte'
  import { useWebcam } from '@uppy/svelte'

  interface Props {
    isOpen: boolean
    close: () => void
  }

  const { isOpen, close }: Props = $props()
  const webcamStore = useWebcam({ onSubmit: close })

  $effect(() => {
    if (isOpen) {
      // Use untrack to not trigger the effect again
      untrack(() => webcamStore.start())
    } else {
      untrack(() => webcamStore.stop())
    }
  })

  onDestroy(() => {
    untrack(() => webcamStore.stop())
  })
</script>

<div class="p-4 max-w-lg w-full">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-bold">Camera</h2>
    <button onclick={close} class="text-gray-500 hover:text-gray-700">
      ✕
    </button>
  </div>
  <video
    class="border-2 w-full rounded-lg data-[uppy-mirrored=true]:scale-x-[-1]"
    {...webcamStore.getVideoProps()}
  ></video>
  <div class="flex gap-4 mt-4">
    <button
      class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
      {...webcamStore.getSnapshotButtonProps()}
    >
      Snapshot
    </button>
    <button
      class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
      {...webcamStore.getRecordButtonProps()}
    >
      Record
    </button>
    <button
      class="bg-red-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-red-300"
      {...webcamStore.getStopRecordingButtonProps()}
    >
      Stop
    </button>
    <button
      class="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-green-300"
      {...webcamStore.getSubmitButtonProps()}
    >
      Submit
    </button>
    <button
      class="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-gray-300"
      {...webcamStore.getDiscardButtonProps()}
    >
      Discard
    </button>
  </div>
</div>
