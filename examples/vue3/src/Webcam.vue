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
  />
</template>

<script setup lang="ts">
import { useWebcam } from '@uppy/vue'
import { onMounted, watch } from 'vue'
import MediaCapture from './MediaCapture.vue'

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
