function toRadians (angle) {
  return angle * (Math.PI / 180)
}

function getScaleFactorThatRemovesDarkCorners (imageData) {
  let rotation = toRadians(imageData.rotate)

  if (rotation < 0) {
    rotation = 2 * Math.PI - rotation
  }

  const a = imageData.width
  const b = imageData.height

  const scaleFactor = Math.max(
    (Math.sin(rotation) * a + Math.cos(rotation) * b) / b,
    (Math.sin(rotation) * b + Math.cos(rotation) * a) / a,
  )

  return scaleFactor
}

export default getScaleFactorThatRemovesDarkCorners
