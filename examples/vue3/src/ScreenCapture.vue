<template>
  <div class="p-4 max-w-lg w-full">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Screen Capture</h2>
      <button @click="props.close" class="text-gray-500 hover:text-gray-700">
        ✕
      </button>
    </div>
    <video
      class="border-2 w-full rounded-lg"
      v-bind="screenCapture.getVideoProps()"
    />
    <div class="flex gap-2.5 flex-wrap mt-4">
      <button
        class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
        v-bind="screenCapture.getScreenshotButtonProps()"
      >
        Screenshot
      </button>
      <button
        class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
        v-bind="screenCapture.getRecordButtonProps()"
      >
        Record
      </button>
      <button
        class="bg-red-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-red-300"
        v-bind="screenCapture.getStopRecordingButtonProps()"
      >
        Stop
      </button>
      <button
        class="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-green-300"
        v-bind="screenCapture.getSubmitButtonProps()"
      >
        Submit
      </button>
      <button
        class="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-gray-300"
        v-bind="screenCapture.getDiscardButtonProps()"
      >
        Discard
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useScreenCapture } from '@uppy/vue'
import { onMounted, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  close: () => void
}>()

const screenCapture = useScreenCapture({ onSubmit: props.close })

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      screenCapture.value.start()
    } else {
      screenCapture.value.stop()
    }
  },
)

onMounted(() => {
  if (props.isOpen) {
    screenCapture.value.start()
  }
  return () => {
    screenCapture.value.stop()
  }
})
</script>
