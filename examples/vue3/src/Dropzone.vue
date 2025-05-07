<template>
  <div v-bind="getRootProps()" class="border-2 border-gray-300 rounded-md p-2">
    <input v-bind="getInputProps()" />
  </div>
</template>

<script setup lang="ts">
import { useDropzone } from '@uppy/vue'

const { getRootProps, getInputProps } = useDropzone()
</script>
