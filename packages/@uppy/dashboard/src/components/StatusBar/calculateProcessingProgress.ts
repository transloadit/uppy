import type { FileProcessingInfo } from '@uppy/utils/lib/FileProgress'
import type { UppyFile } from '@uppy/utils/lib/UppyFile'

export default function calculateProcessingProgress(
  files: Record<string, UppyFile<any, any>>,
): FileProcessingInfo {
  const values: number[] = []
  let mode: FileProcessingInfo['mode'] = 'indeterminate'
  let message: FileProcessingInfo['message']

  for (const { progress } of Object.values(files)) {
    const { preprocess, postprocess } = progress
    // In the future we should probably do this differently. For now we'll take the
    // mode and message from the first file…
    if (message == null && (preprocess || postprocess)) {
      ;({ mode, message } = preprocess || postprocess!)
    }
    if (preprocess?.mode === 'determinate') values.push(preprocess.value)
    if (postprocess?.mode === 'determinate') values.push(postprocess.value)
  }

  const value = values.reduce((total, progressValue) => {
    return total + progressValue / values.length
  }, 0)

  return {
    mode,
    message,
    value,
  } as FileProcessingInfo
}
