<template>
  <UppyContextProvider :uppy="uppy">
    <main class="p-5 max-w-xl mx-auto">
      <h1 class="text-4xl font-bold my-4">Welcome to Vue.</h1>

      <UploadButton />

      <dialog
        ref="dialogRef"
        class="backdrop:bg-gray-500/50 rounded-lg shadow-xl p-0 fixed inset-0 m-auto"
      >
        <Webcam v-if="modalPlugin === 'webcam'" :close="closeModal" />
        <RemoteSource
          v-if="modalPlugin === 'dropbox'"
          id="Dropbox"
          :close="closeModal"
        />
        <ScreenCapture
          v-if="modalPlugin === 'screen-capture'"
          :close="closeModal"
        />
      </dialog>

      <article>
        <h2 class="text-2xl my-4">With list</h2>
        <Dropzone />
        <FilesList />
      </article>

      <article>
        <h2 class="text-2xl my-4">With grid</h2>
        <Dropzone />
        <FilesGrid :columns="2" />
      </article>

      <article>
        <h2 class="text-2xl my-4">With custom dropzone</h2>
        <CustomDropzone :openModal="openModal" />
      </article>
    </main>
  </UppyContextProvider>
</template>

<script setup lang="ts">
import Uppy from '@uppy/core'
import UppyRemoteSources from '@uppy/remote-sources'
import UppyScreenCapture from '@uppy/screen-capture'
import Tus from '@uppy/tus'
import {
  Dropzone,
  FilesGrid,
  FilesList,
  UploadButton,
  UppyContextProvider,
} from '@uppy/vue'
import UppyWebcam from '@uppy/webcam'
import { computed, ref } from 'vue'
import CustomDropzone from './Dropzone.vue'
import RemoteSource from './RemoteSource.vue'
import ScreenCapture from './ScreenCapture.vue'
import Webcam from './Webcam.vue'

const dialogRef = ref<HTMLDialogElement | null>(null)
const modalPlugin = ref<'webcam' | 'dropbox' | 'screen-capture' | null>(null)

function openModal(plugin: 'webcam' | 'dropbox' | 'screen-capture') {
  modalPlugin.value = plugin
  dialogRef.value?.showModal()
}

function closeModal() {
  modalPlugin.value = null
  dialogRef.value?.close()
}

const uppy = computed(() =>
  new Uppy()
    .use(Tus, {
      endpoint: 'https://tusd.tusdemo.net/files/',
    })
    .use(UppyWebcam)
    .use(UppyScreenCapture)
    .use(UppyRemoteSources, { companionUrl: 'http://localhost:3020' }),
)
</script>

<style src="@uppy/vue/css/style.css"></style>
