/**
 * Save a <canvas> element's content to a Blob object.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise}
 */
export default function canvasToBlob (canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}
