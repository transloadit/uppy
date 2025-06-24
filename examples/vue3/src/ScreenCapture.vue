<template>
  <MediaCapture
    title="Screen Capture"
    :close="props.close"
    :video-props="screenCapture.getVideoProps()"
    :primary-action-button-props="screenCapture.getScreenshotButtonProps()"
    primary-action-button-label="Screenshot"
    :record-button-props="screenCapture.getRecordButtonProps()"
    :stop-recording-button-props="screenCapture.getStopRecordingButtonProps()"
    :submit-button-props="screenCapture.getSubmitButtonProps()"
    :discard-button-props="screenCapture.getDiscardButtonProps()"
  />
</template>

<script setup lang="ts">
import { useScreenCapture } from '@uppy/vue'
import { onMounted } from 'vue'
import MediaCapture from './MediaCapture.vue'

const props = defineProps<{
  close: () => void
}>()

const screenCapture = useScreenCapture({ onSubmit: props.close })

onMounted(() => {
  screenCapture.value.start()
  return () => {
    screenCapture.value.stop()
  }
})
</script>
