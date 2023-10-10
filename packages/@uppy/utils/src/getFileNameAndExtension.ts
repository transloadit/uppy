/**
 * Takes a full filename string and returns an object {name, extension}
 */
export default function getFileNameAndExtension(fullFileName: string): {
  name: string
  extension: string | undefined
} {
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
