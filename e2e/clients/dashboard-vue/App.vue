<template>
  <UppyContextProvider :uppy="uppy">
    <main>
      <h1>Vue Headless Components Test</h1>

      <article id="files-list">
        <h2>With list</h2>
        <Dropzone />
        <FilesList />
        <UploadButton />
      </article>

      <article id="files-grid">
        <h2>With grid</h2>
        <Dropzone />
        <FilesGrid :columns="2" />
        <UploadButton />
      </article>
    </main>
  </UppyContextProvider>
</template>

<script>
import Vue from 'vue'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import {
  UppyContextProvider,
  Dropzone,
  FilesList,
  FilesGrid,
  UploadButton,
} from '@uppy/vue'

export default {
  name: 'App',
  components: {
    UppyContextProvider,
    Dropzone,
    FilesList,
    FilesGrid,
    UploadButton,
  },
  computed: {
    uppy: () =>
      new Uppy().use(Tus, {
        endpoint: 'https://tusd.tusdemo.net/files/',
      }),
  },
}
</script>

<style src="@uppy/vue/dist/styles.css"></style>
