function toRadians (angle) {
  return angle * (Math.PI / 180)
}

function getScaleFactorThatRemovesDarkCorners (cropboxData, newGranularAngle) {
  const rotation = toRadians(newGranularAngle)

  const a = cropboxData.width
  const b = cropboxData.height

  const scaleFactor = Math.max(
    (Math.abs(Math.sin(rotation)) * a + Math.abs(Math.cos(rotation)) * b) / b,
    (Math.abs(Math.sin(rotation)) * b + Math.abs(Math.cos(rotation)) * a) / a,
  )

  return scaleFactor
}

export default getScaleFactorThatRemovesDarkCorners
