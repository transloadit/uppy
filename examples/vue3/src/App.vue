<template>
  <UppyContextProvider :uppy="uppy">
    <main class="p-5 max-w-xl mx-auto">
      <h1 class="text-4xl font-bold">Welcome to Vue.</h1>

      <article>
        <h2 class="text-2xl my-4">With list</h2>
        <Dropzone />
        <FilesList />
        <UploadButton />
      </article>

      <article>
        <h2 class="text-2xl my-4">With grid</h2>
        <Dropzone />
        <FilesGrid :columns="2" />
        <UploadButton />
      </article>
    </main>
  </UppyContextProvider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import {
  UppyContextProvider,
  Dropzone,
  FilesList,
  FilesGrid,
  UploadButton,
} from '@uppy/vue'

const uppy = computed(() =>
  new Uppy().use(Tus, {
    endpoint: 'https://tusd.tusdemo.net/files/',
  }),
)
</script>

<style src="@uppy/vue/dist/styles.css"></style>
