<script lang="ts">
  import MediaCapture from './MediaCapture.svelte'
  import { untrack } from 'svelte'
  import { useScreenCapture } from '@uppy/svelte'

  interface Props {
    close: () => void
  }

  const { close }: Props = $props()
  const screenCaptureStore = useScreenCapture({ onSubmit: close })

  $effect(() => {
    untrack(() => screenCaptureStore.start())
    return () => {
      untrack(() => screenCaptureStore.stop())
    }
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
