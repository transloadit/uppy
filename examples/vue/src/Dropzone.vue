<template>
  <input v-bind="getInputProps()" class="hidden" />
  <div
    v-bind="getRootProps()"
    role="button"
    class="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors duration-200"
  >
    <div class="flex items-center justify-center gap-4">
      <input v-bind="getFileInputProps()" class="hidden" />
      <button
        v-bind="getButtonProps()"
        class="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
      >
        <div class="bg-white shadow-md rounded-md p-1">
          <ProviderIcon provider="device" fill="#1269cf" />
        </div>
        Device
      </button>

      <button
        @click="() => props.openModal('webcam')"
        class="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
      >
        <div class="bg-white shadow-md rounded-md p-1">
          <ProviderIcon provider="camera" fill="#02B383" />
        </div>
        Webcam
      </button>

      <button
        @click="() => props.openModal('screen-capture')"
        class="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
      >
        <div class="bg-white shadow-md rounded-md p-1">
          <ProviderIcon provider="screen-capture" fill="#FF69B4" />
        </div>
        Screen Capture
      </button>

      <button
        @click="() => props.openModal('dropbox')"
        class="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
      >
        <div class="bg-white shadow-md rounded-md p-1">
          <ProviderIcon provider="dropbox" />
        </div>
        Dropbox
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ProviderIcon, useDropzone, useFileInput } from '@uppy/vue'

const props = defineProps<{
  openModal: (plugin: 'webcam' | 'dropbox' | 'screen-capture') => void
}>()

const { getRootProps, getInputProps } = useDropzone({
  noClick: true,
})
const { getButtonProps, getInputProps: getFileInputProps } = useFileInput()
</script>
