/**
 * Takes a full filename string and returns an object {name, extension}
 *
 * @param {string} fullFileName
 * @returns {object} {name, extension}
 */
export default function getFileNameAndExtension (fullFileName) {
  const lastDot = fullFileName.lastIndexOf('.')
  // these count as no extension: "no-dot", "trailing-dot."
  if (lastDot === -1 || lastDot === fullFileName.length - 1) {
    return {
      name: fullFileName,
      extension: undefined,
    }
  }
  return {
    name: fullFileName.slice(0, lastDot),
    extension: fullFileName.slice(lastDot + 1),
  }
}
