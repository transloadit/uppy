import type Cropper from 'cropperjs'

// See this cropperjs image to understand how container/image/canavas/cropbox relate to each other.
// (https://github.com/fengyuanchen/cropperjs/blob/9b528a8baeaae876dc090085e37992a1683c6f34/docs/images/layers.jpg)
//
function getCanvasDataThatFitsPerfectlyIntoContainer(
  containerData: Cropper.ContainerData,
  canvasData: Cropper.CanvasData,
): { width: number; height: number; left: number; top: number } {
  // 1. Scale our canvas as much as possible
  const widthRatio = containerData.width / canvasData.width
  const heightRatio = containerData.height / canvasData.height
  const scaleFactor = Math.min(widthRatio, heightRatio)

  const newWidth = canvasData.width * scaleFactor
  const newHeight = canvasData.height * scaleFactor

  // 2. Center our canvas
  const newLeft = (containerData.width - newWidth) / 2
  const newTop = (containerData.height - newHeight) / 2

  return {
    width: newWidth,
    height: newHeight,
    left: newLeft,
    top: newTop,
  }
}

export default getCanvasDataThatFitsPerfectlyIntoContainer
