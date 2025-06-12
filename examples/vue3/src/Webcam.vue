<template>
  <div class="p-4 max-w-lg w-full">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Camera</h2>
      <button @click="props.close" class="text-gray-500 hover:text-gray-700">
        ✕
      </button>
    </div>
    <video
      class="border-2 w-full rounded-lg data-[uppy-mirrored=true]:scale-x-[-1]"
      v-bind="webcam.getVideoProps()"
    />
    <div class="flex gap-4 mt-4">
      <button
        class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
        v-bind="webcam.getSnapshotButtonProps()"
      >
        Snapshot
      </button>
      <button
        class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
        v-bind="webcam.getRecordButtonProps()"
      >
        Record
      </button>
      <button
        class="bg-red-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-red-300"
        v-bind="webcam.getStopRecordingButtonProps()"
      >
        Stop
      </button>
      <button
        class="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-green-300"
        v-bind="webcam.getSubmitButtonProps()"
      >
        Submit
      </button>
      <button
        class="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-gray-300"
        v-bind="webcam.getDiscardButtonProps()"
      >
        Discard
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWebcam } from '@uppy/vue'
import { onMounted, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  close: () => void
}>()

const webcam = useWebcam({ onSubmit: props.close })

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      webcam.value.start()
    } else {
      webcam.value.stop()
    }
  },
)

onMounted(() => {
  if (props.isOpen) {
    webcam.value.start()
  }
  return () => {
    webcam.value.stop()
  }
})
</script>
