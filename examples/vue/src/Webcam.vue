<template>
  <MediaCapture
    title="Camera"
    :close="props.close"
    :video-props="webcam.getVideoProps()"
    :primary-action-button-props="webcam.getSnapshotButtonProps()"
    primary-action-button-label="Snapshot"
    :record-button-props="webcam.getRecordButtonProps()"
    :stop-recording-button-props="webcam.getStopRecordingButtonProps()"
    :submit-button-props="webcam.getSubmitButtonProps()"
    :discard-button-props="webcam.getDiscardButtonProps()"
    :media-error="webcam.state.cameraError"
  />
</template>

<script setup lang="ts">
import { useWebcam } from '@uppy/vue'
import { onMounted } from 'vue'
import MediaCapture from './MediaCapture.vue'

const props = defineProps<{
  close: () => void
}>()

const webcam = useWebcam({ onSubmit: props.close })

onMounted(() => {
  webcam.value.start()
  return () => {
    webcam.value.stop()
  }
})
</script>
