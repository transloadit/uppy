import type Cropper from 'cropperjs'

function limitCropboxMovementOnMove(
  canvas: Cropper.CanvasData,
  cropbox: Cropper.CropBoxData,
  prevCropbox: Cropper.CropBoxData,
): { left?: number; top?: number; width?: number; height?: number } | null {
  // For the left boundary
  if (cropbox.left < canvas.left) {
    return {
      left: canvas.left,
      width: prevCropbox.width,
    }
  }

  // For the top boundary
  if (cropbox.top < canvas.top) {
    return {
      top: canvas.top,
      height: prevCropbox.height,
    }
  }

  // For the right boundary
  if (cropbox.left + cropbox.width > canvas.left + canvas.width) {
    return {
      left: canvas.left + canvas.width - prevCropbox.width,
      width: prevCropbox.width,
    }
  }

  // For the bottom boundary
  if (cropbox.top + cropbox.height > canvas.top + canvas.height) {
    return {
      top: canvas.top + canvas.height - prevCropbox.height,
      height: prevCropbox.height,
    }
  }

  return null
}

export default limitCropboxMovementOnMove
