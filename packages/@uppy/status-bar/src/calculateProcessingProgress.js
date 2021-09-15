module.expost = function calculateProcessingProgress (files) {
  // Collect pre or postprocessing progress states.
  const progresses = []

  Object.keys(files).forEach((fileID) => {
    const { progress } = files[fileID]
    if (progress.preprocess) {
      progresses.push(progress.preprocess)
    }
    if (progress.postprocess) {
      progresses.push(progress.postprocess)
    }
  })

  // In the future we should probably do this differently. For now we'll take the
  // mode and message from the first file…
  const { mode, message } = progresses[0]
  const value = progresses.filter(isDeterminate).reduce((total, progress, index, all) => {
    return total + progress.value / all.length
  }, 0)
  function isDeterminate (progress) {
    return progress.mode === 'determinate'
  }

  return {
    mode,
    message,
    value,
  }
}
