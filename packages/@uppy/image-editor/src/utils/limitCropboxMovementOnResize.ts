import type Cropper from 'cropperjs'

function limitCropboxMovementOnResize(
  canvas: Cropper.CanvasData,
  cropboxData: Cropper.CropBoxData,
  prevCropbox: Cropper.CropBoxData,
): { left?: number; top?: number; width?: number; height?: number } | null {
  // For the left boundary
  if (cropboxData.left < canvas.left) {
    return {
      left: canvas.left,
      width: prevCropbox.left + prevCropbox.width - canvas.left,
    }
  }

  // For the top boundary
  if (cropboxData.top < canvas.top) {
    return {
      top: canvas.top,
      height: prevCropbox.top + prevCropbox.height - canvas.top,
    }
  }

  // For the right boundary
  if (cropboxData.left + cropboxData.width > canvas.left + canvas.width) {
    return {
      left: prevCropbox.left,
      width: canvas.left + canvas.width - prevCropbox.left,
    }
  }

  // For the bottom boundary
  if (cropboxData.top + cropboxData.height > canvas.top + canvas.height) {
    return {
      top: prevCropbox.top,
      height: canvas.top + canvas.height - prevCropbox.top,
    }
  }

  return null
}

export default limitCropboxMovementOnResize
