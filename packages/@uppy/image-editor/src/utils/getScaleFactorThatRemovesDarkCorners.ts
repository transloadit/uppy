function toRadians(angle: number) {
  return angle * (Math.PI / 180)
}

function getScaleFactorThatRemovesDarkCorners(
  w: number,
  h: number,
  granularAngle: number,
): number {
  const α = Math.abs(toRadians(granularAngle))

  const scaleFactor = Math.max(
    (Math.sin(α) * w + Math.cos(α) * h) / h,
    (Math.sin(α) * h + Math.cos(α) * w) / w,
  )

  return scaleFactor
}

export default getScaleFactorThatRemovesDarkCorners
