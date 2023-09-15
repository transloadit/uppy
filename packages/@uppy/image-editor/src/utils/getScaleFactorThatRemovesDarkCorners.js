function toRadians (angle) {
  return angle * (Math.PI / 180)
}

function getScaleFactorThatRemovesDarkCorners (originalImageDimensions, granularAngle) {
  const α = Math.abs(toRadians(granularAngle))

  const w = originalImageDimensions.width
  const h = originalImageDimensions.height

  const scaleFactor = Math.max(
    (Math.sin(α) * w + Math.cos(α) * h) / h,
    (Math.sin(α) * h + Math.cos(α) * w) / w,
  )

  return scaleFactor
}

export default getScaleFactorThatRemovesDarkCorners
