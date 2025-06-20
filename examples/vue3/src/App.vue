<template>
  <UppyContextProvider :uppy="uppy">
    <main class="p-5 max-w-xl mx-auto">
      <h1 class="text-4xl font-bold my-4">Welcome to Vue.</h1>

      <UploadButton />

      <dialog
        ref="webcamDialogRef"
        class="backdrop:bg-gray-500/50 rounded-lg shadow-xl p-0 fixed inset-0 m-auto"
      >
        <Webcam :isOpen="isWebcamOpen" :close="closeWebcamModal" />
      </dialog>

      <dialog
        ref="screenCaptureDialogRef"
        class="backdrop:bg-gray-500/50 rounded-lg shadow-xl p-0 fixed inset-0 m-auto"
      >
        <ScreenCapture
          :isOpen="isScreenCaptureOpen"
          :close="closeScreenCaptureModal"
        />
      </dialog>

      <article>
        <h2 class="text-2xl my-4">With list</h2>
        <Dropzone
          :openWebcamModal="openWebcamModal"
          :openScreenCaptureModal="openScreenCaptureModal"
        />
        <FilesList />
      </article>

      <article>
        <h2 class="text-2xl my-4">With grid</h2>
        <Dropzone
          :openWebcamModal="openWebcamModal"
          :openScreenCaptureModal="openScreenCaptureModal"
        />
        <FilesGrid :columns="2" />
      </article>

      <article>
        <h2 class="text-2xl my-4">With custom dropzone</h2>
        <CustomDropzone
          :openWebcamModal="openWebcamModal"
          :openScreenCaptureModal="openScreenCaptureModal"
        />
      </article>
    </main>
  </UppyContextProvider>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import {
  UppyContextProvider,
  Dropzone,
  FilesList,
  FilesGrid,
  UploadButton,
} from '@uppy/vue'
import CustomDropzone from './Dropzone.vue'
import Webcam from './Webcam.vue'
import ScreenCapture from './ScreenCapture.vue'
import UppyWebcam from '@uppy/webcam'
import UppyScreenCapture from '@uppy/screen-capture'

const webcamDialogRef = ref<HTMLDialogElement | null>(null)
const isWebcamOpen = ref(false)
const screenCaptureDialogRef = ref<HTMLDialogElement | null>(null)
const isScreenCaptureOpen = ref(false)

function openWebcamModal() {
  isWebcamOpen.value = true
  webcamDialogRef.value?.showModal()
}

function closeWebcamModal() {
  isWebcamOpen.value = false
  webcamDialogRef.value?.close()
}

function openScreenCaptureModal() {
  isScreenCaptureOpen.value = true
  screenCaptureDialogRef.value?.showModal()
}

function closeScreenCaptureModal() {
  isScreenCaptureOpen.value = false
  screenCaptureDialogRef.value?.close()
}

const uppy = computed(() =>
  new Uppy()
    .use(Tus, {
      endpoint: 'https://tusd.tusdemo.net/files/',
    })
    .use(UppyWebcam)
    .use(UppyScreenCapture),
)
</script>

<style src="@uppy/vue/dist/styles.css"></style>
