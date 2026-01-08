<template>
  <div class="p-4 max-w-2xl w-full">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Edit Image</h2>
      <button
        type="button"
        @click="close"
        class="text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>
    </div>

    <div class="mb-4">
      <img
        class="w-full max-h-[400px] rounded-lg border-2"
        v-bind="editor.getImageProps()"
      />
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-2">
        Fine Rotation: {{ editor.state.angle }}°
      </label>
      <input
        class="w-full"
        v-bind="editor.getRotationSliderProps()"
      />
    </div>

    <div class="flex gap-2 flex-wrap mb-4">
      <button
        class="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        v-bind="editor.getRotateButtonProps(-90)"
      >
        ↶ -90°
      </button>
      <button
        class="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        v-bind="editor.getRotateButtonProps(90)"
      >
        ↷ +90°
      </button>
      <button
        class="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        v-bind="editor.getFlipHorizontalButtonProps()"
      >
        ⇆ Flip
      </button>
      <button
        class="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        v-bind="editor.getZoomButtonProps(0.1)"
      >
        + Zoom
      </button>
      <button
        class="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        v-bind="editor.getZoomButtonProps(-0.1)"
      >
        - Zoom
      </button>
    </div>

    <div class="flex gap-2 flex-wrap mb-4">
      <button
        class="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        v-bind="editor.getCropSquareButtonProps()"
      >
        1:1
      </button>
      <button
        class="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        v-bind="editor.getCropLandscapeButtonProps()"
      >
        16:9
      </button>
      <button
        class="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        v-bind="editor.getCropPortraitButtonProps()"
      >
        9:16
      </button>
      <button
        class="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        v-bind="editor.getResetButtonProps()"
      >
        Reset
      </button>
    </div>

    <div class="flex gap-4 justify-end">
      <button
        class="bg-gray-500 text-white px-4 py-2 rounded-md"
        v-bind="editor.getCancelButtonProps({ onClick: close })"
      >
        Cancel
      </button>
      <button
        class="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-green-300"
        v-bind="editor.getSaveButtonProps({ onClick: close })"
      >
        Save
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UppyFile } from '@uppy/core'
import { useImageEditor } from '@uppy/vue'

const props = defineProps<{
  file: UppyFile<any, any>
  close: () => void
}>()

const editor = useImageEditor({ file: props.file })
</script>
