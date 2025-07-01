<script lang="ts">
  import { useDropzone, useFileInput, ProviderIcon } from '@uppy/svelte'

  interface Props {
    openModal: (plugin: 'webcam' | 'dropbox' | 'screen-capture') => void
  }

  const { openModal }: Props = $props()

  const { getRootProps, getInputProps } = useDropzone({ noClick: true })
  const { getButtonProps, getInputProps: getFileInputProps } = useFileInput()
</script>

<div>
  <input {...getInputProps()} class="uppy:hidden" />
  <div
    {...getRootProps()}
    role="button"
    class="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors duration-200"
  >
    <div class="flex items-center justify-center gap-4">
      <input {...getFileInputProps()} class="hidden" />
      <button
        {...getButtonProps()}
        class="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
      >
        <div class="bg-white shadow-md rounded-md p-1">
          <ProviderIcon provider="device" fill="#1269cf" />
        </div>
        Device
      </button>

      <button
        onclick={() => openModal('webcam')}
        class="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
      >
        <div class="bg-white shadow-md rounded-md p-1">
          <ProviderIcon provider="camera" fill="#02B383" />
        </div>
        Webcam
      </button>

      <button
        onclick={() => openModal('screen-capture')}
        class="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
      >
        <div class="bg-white shadow-md rounded-md p-1">
          <ProviderIcon provider="screen-capture" fill="#FF69B4" />
        </div>
        Screen Capture
      </button>

      <button
        onclick={() => openModal('dropbox')}
        class="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
      >
        <div class="bg-white shadow-md rounded-md p-1">
          <ProviderIcon provider="dropbox" />
        </div>
        Dropbox
      </button>
    </div>
  </div>
</div>
