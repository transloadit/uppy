<script lang="ts">
  type ButtonProps = Record<string, unknown>
  type VideoProps = Record<string, unknown>

  interface Props {
    title: string
    close: () => void
    videoProps: VideoProps
    primaryActionButtonProps: ButtonProps
    primaryActionButtonLabel: string
    recordButtonProps: ButtonProps
    stopRecordingButtonProps: ButtonProps
    submitButtonProps: ButtonProps
    discardButtonProps: ButtonProps
  }

  const {
    title,
    close,
    videoProps,
    primaryActionButtonProps,
    primaryActionButtonLabel,
    recordButtonProps,
    stopRecordingButtonProps,
    submitButtonProps,
    discardButtonProps,
  }: Props = $props()
</script>

<div class="p-4 max-w-lg w-full">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-bold">{title}</h2>
    <button type="button" onclick={close} class="text-gray-500 hover:text-gray-700">
      ✕
    </button>
  </div>
  <video
    class="border-2 w-full rounded-lg data-[uppy-mirrored=true]:scale-x-[-1]"
    {...videoProps}
  ></video>
  <div class="flex gap-4 flex-wrap mt-4">
    <button
      class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
      {...primaryActionButtonProps}
    >
      {primaryActionButtonLabel}
    </button>
    <button
      class="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
      {...recordButtonProps}
    >
      Record
    </button>
    <button
      class="bg-red-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-red-300"
      {...stopRecordingButtonProps}
    >
      Stop
    </button>
    <button
      class="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-green-300"
      {...submitButtonProps}
    >
      Submit
    </button>
    <button
      class="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-gray-300"
      {...discardButtonProps}
    >
      Discard
    </button>
  </div>
</div>
