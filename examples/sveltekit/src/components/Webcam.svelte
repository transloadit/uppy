<script lang="ts">
import { useWebcam } from '@uppy/svelte'
import { untrack } from 'svelte'
import MediaCapture from './MediaCapture.svelte'

interface Props {
  close: () => void
}

const { close }: Props = $props()
const webcamStore = useWebcam({ onSubmit: close })

$effect(() => {
  untrack(() => webcamStore.start())
  return () => {
    untrack(() => webcamStore.stop())
  }
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
  mediaError={webcamStore.state.cameraError}
/>
