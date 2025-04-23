<template>
  <div style="width: 30em; margin: 5rem auto">
    <h1>Uppy Vue Demo</h1>
    <UppyContextProvider :uppy="uppy">
      <Dropzone />
      <FilesList>
        <template v-slot:item="{ file }">
          <div class="my-custom-item">
            Custom: {{ file.name }} ({{ file.size }})
          </div>
        </template>
      </FilesList>
    </UppyContextProvider>
  </div>
</template>

<script setup>
import { UppyContextProvider, Dropzone, FilesList } from '@uppy/vue'
</script>

<script>
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import Webcam from '@uppy/webcam'
import { defineComponent, h } from 'vue'

const { VITE_TUS_ENDPOINT: TUS_ENDPOINT } = import.meta.env

export default defineComponent({
  computed: {
    uppy: () => new Uppy().use(Tus, { endpoint: TUS_ENDPOINT }).use(Webcam),
  },
})
</script>

<style src="@uppy/vue/dist/styles.css"></style>
