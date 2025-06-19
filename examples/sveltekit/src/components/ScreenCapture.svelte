<script lang="ts">
  import MediaCapture from './MediaCapture.svelte'
  import { onDestroy, untrack } from 'svelte'
  import { useScreenCapture } from '@uppy/svelte'

  interface Props {
    isOpen: boolean
    close: () => void
  }

  const { isOpen, close }: Props = $props()
  const screenCaptureStore = useScreenCapture({ onSubmit: close })

  $effect(() => {
    if (isOpen) {
      // Use untrack to not trigger the effect again
      untrack(() => screenCaptureStore.start())
    } else {
      untrack(() => screenCaptureStore.stop())
    }
  })

  onDestroy(() => {
    untrack(() => screenCaptureStore.stop())
  })
</script>

<MediaCapture
  title="Screen Capture"
  {close}
  videoProps={screenCaptureStore.getVideoProps()}
  primaryActionButtonProps={screenCaptureStore.getScreenshotButtonProps()}
  primaryActionButtonLabel="Screenshot"
  recordButtonProps={screenCaptureStore.getRecordButtonProps()}
  stopRecordingButtonProps={screenCaptureStore.getStopRecordingButtonProps()}
  submitButtonProps={screenCaptureStore.getSubmitButtonProps()}
  discardButtonProps={screenCaptureStore.getDiscardButtonProps()}
/>
