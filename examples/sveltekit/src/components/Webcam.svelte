<script lang="ts">
  import MediaCapture from './MediaCapture.svelte'
  import { onDestroy, untrack } from 'svelte'
  import { useWebcam } from '@uppy/svelte'

  interface Props {
    isOpen: boolean
    close: () => void
  }

  const { isOpen, close }: Props = $props()
  const webcamStore = useWebcam({ onSubmit: close })

  $effect(() => {
    if (isOpen) {
      // Use untrack to not trigger the effect again
      untrack(() => webcamStore.start())
    } else {
      untrack(() => webcamStore.stop())
    }
  })

  onDestroy(() => {
    untrack(() => webcamStore.stop())
  })
</script>

<MediaCapture
  title="Camera"
  {close}
  videoProps={webcamStore.getVideoProps()}
  primaryActionButtonProps={webcamStore.getSnapshotButtonProps()}
  primaryActionButtonLabel="Snapshot"
  recordButtonProps={webcamStore.getRecordButtonProps()}
  stopRecordingButtonProps={webcamStore.getStopRecordingButtonProps()}
  submitButtonProps={webcamStore.getSubmitButtonProps()}
  discardButtonProps={webcamStore.getDiscardButtonProps()}
/>
