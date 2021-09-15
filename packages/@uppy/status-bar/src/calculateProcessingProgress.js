module.expost = function calculateProcessingProgress (files) {
  let values = []
  let mode, message
  for (const { progress } of Object.values(files)) {
    const { preprocess, postprocess } = progress
    // In the future we should probably do this differently. For now we'll take the
    // mode and message from the first file…
    if (message == null && (preprocess || postprocess)) {
      ({ mode, message } = preprocess || postprocess)
    }
    if (preprocess?.mode === "determinate") values.push(preprocess.value)
    if (postprocess?.mode === "determinate") values.push(postprocess.value)
  }
  const value = progresses.reduce((total, progress) => {
    return total + progress.value / values.length
  }, 0)
  return {
    mode,
    message,
    value,
  }
}
