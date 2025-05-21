<template>
  <div class="">
    <video class="border-2 w-full" v-bind="webcam.getVideoProps()" />
    <div class="flex gap-4">
      <button
        class="disabled:opacity-50"
        v-bind="webcam.getSnapshotButtonProps()"
      >
        Snapshot
      </button>
      <button
        class="disabled:opacity-50"
        v-bind="webcam.getRecordButtonProps()"
      >
        Record
      </button>
      <button
        class="disabled:opacity-50"
        v-bind="webcam.getStopRecordingButtonProps()"
      >
        Stop
      </button>
      <button
        class="disabled:opacity-50"
        v-bind="webcam.getSubmitButtonProps()"
      >
        Submit
      </button>
      <button
        class="disabled:opacity-50"
        v-bind="webcam.getDiscardButtonProps()"
      >
        Discard
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWebcam } from '@uppy/vue'

const webcam = useWebcam()
</script>
