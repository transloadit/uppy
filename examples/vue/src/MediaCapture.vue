<template>
  <div class="p-4 max-w-lg w-full">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">{{ title }}</h2>
      <button
        type="button"
        @click="close"
        class="text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>
    </div>
    <div
      v-if="mediaError"
      class="p-4 my-2 text-red-700 bg-red-100 border border-red-400 rounded"
    >
      <p class="font-bold">Error</p>
      <p>{{ mediaError.message ? `Camera error: ${mediaError.message}` : 'An unknown camera error occurred.' }}</p>
    </div>
    <video
      class="border-2 w-full rounded-lg data-[uppy-mirrored=true]:scale-x-[-1]"
      v-bind="videoProps"
    >
      <track kind="captions" />
    </video>
    <div class="flex gap-4 flex-wrap mt-4">
      <button
        class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
        v-bind="primaryActionButtonProps"
      >
        {{ primaryActionButtonLabel }}
      </button>
      <button
        class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
        v-bind="recordButtonProps"
      >
        Record
      </button>
      <button
        class="bg-red-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-red-300"
        v-bind="stopRecordingButtonProps"
      >
        Stop
      </button>
      <button
        class="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-green-300"
        v-bind="submitButtonProps"
      >
        Submit
      </button>
      <button
        class="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-gray-300"
        v-bind="discardButtonProps"
      >
        Discard
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  close: () => void
  videoProps: Record<string, unknown>
  primaryActionButtonProps: Record<string, unknown>
  primaryActionButtonLabel: string
  recordButtonProps: Record<string, unknown>
  stopRecordingButtonProps: Record<string, unknown>
  submitButtonProps: Record<string, unknown>
  discardButtonProps: Record<string, unknown>
  mediaError?: Error | null
}>()
</script>
