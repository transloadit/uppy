<template>
  <div class="">
    <video
      class="border-2 w-full"
      ref="videoRef"
      v-bind="getVideoProps(videoRef)"
    />
    <div class="flex gap-4">
      <button class="disabled:opacity-50" v-bind="getSnapshotButtonProps()">
        Snapshot
      </button>
      <button class="disabled:opacity-50" v-bind="getRecordButtonProps()">
        Record
      </button>
      <button
        class="disabled:opacity-50"
        v-bind="getStopRecordingButtonProps()"
      >
        Stop
      </button>
      <button class="disabled:opacity-50" v-bind="getSubmitButtonProps()">
        Submit
      </button>
      <button class="disabled:opacity-50" v-bind="getDiscardButtonProps()">
        Discard
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWebcam } from '@uppy/vue'
import { useTemplateRef } from 'vue'

const videoRef = useTemplateRef('videoRef')

const {
  getVideoProps,
  getSnapshotButtonProps,
  getRecordButtonProps,
  getStopRecordingButtonProps,
  getSubmitButtonProps,
  getDiscardButtonProps,
} = useWebcam()
</script>
