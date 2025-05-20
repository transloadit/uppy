<template>
  <div>
    <input v-bind="getInputProps()" class="hidden" />
    <div
      v-bind="getRootProps()"
      class="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors duration-200"
      :class="{ 'bg-blue-50': isDragging }"
    >
      <div class="flex flex-col items-center justify-center h-full space-y-3">
        <input v-bind="getFileInputProps()" class="hidden" />
        <button
          v-bind="getButtonProps()"
          class="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
        >
          <div class="bg-white shadow-md rounded-md p-1">
            <ProviderIcon provider="device" fill="#02B383" />
          </div>
          Device
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDropzone, useFileInput, ProviderIcon } from '@uppy/vue'
const { getRootProps, getInputProps, isDragging } = useDropzone({
  noClick: true,
})
const { getInputProps: getFileInputProps, getButtonProps } = useFileInput()
</script>
